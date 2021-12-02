import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Image,
  BackHandler,
} from "react-native";
import * as tf from "@tensorflow/tfjs";
import { decodeJpeg, bundleResourceIO } from "@tensorflow/tfjs-react-native";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { StatusBar } from "expo-status-bar";

const CLASSES = [
  "Melanoma",
  "Basal Cell Carcinoma",
  "Melanocytic Nevus",
  "Actinic Keratosis",
  "Benign Keratosis",
  "Vascular Lesions",
  "Dermatofibroma",
];

const DESCRIPTIONS = [
  "The most serious type of skin cancer.",
  "A type of skin cancer that begins in the basal cells.",
  "A usually noncancerous disorder of pigment-producing skin cells commonly called birth marks or moles.",
  "A rough, scaly patch on the skin caused by years of sun exposure.",
  "A noncancerous skin condition that appears as a waxy brown, black, or tan growth.",
  "Relatively common abnormalities of the skin and underlying tissues, more commonly known as birthmarks.",
  "A common benign fibrous nodule usually found on the skin of the lower legs.",
];

export default function App() {
  const [isTfReady, setIsTfReady] = useState(false);
  const [binaryModel, setBinaryModel] = useState(null);
  const [multiclass1Model, setMulticlass1Model] = useState(null);
  const [multiclass2Model, setMulticlass2Model] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [malignantProb, setMalignantProb] = useState(0);
  const [multiclassProbs, setMulticlassProbs] = useState(null);
  const cameraRef = useRef(null);
  const [isCamera, setIsCamera] = useState(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [isPreview, setIsPreview] = useState(false);
  const [pictureUri, setPictureUri] = useState(null);

  useEffect(() => {
    loadTf();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isCamera) {
          setIsCamera(false);
          return true;
        } else if (isPreview) {
          retakePicture();
          return true;
        }
        return false;
      }
    );
    return () => backHandler.remove();
  });

  const loadTf = async () => {
    await tf.ready();

    // Binary
    const binaryJson = require("./assets/models/binary_melanoma.json");
    const binaryWeights = require("./assets/models/binary_melanoma.bin");
    const binaryModel = await tf.loadGraphModel(
      bundleResourceIO(binaryJson, binaryWeights)
    );
    setBinaryModel(binaryModel);

    // Multiclass 1
    const multiclass1Json = require("./assets/models/multiclass1.json");
    const multiclass1Weights = require("./assets/models/multiclass1.bin");
    const multiclass1Model = await tf.loadLayersModel(
      bundleResourceIO(multiclass1Json, multiclass1Weights)
    );
    setMulticlass1Model(multiclass1Model);

    // Multiclass 2
    const multiclass2Json = require("./assets/models/multiclass2/multiclass2.json");
    const multiclass2Weights = [
      require("./assets/models/multiclass2/multiclass2-shard1of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard2of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard3of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard4of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard5of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard6of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard7of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard8of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard9of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard10of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard11of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard12of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard13of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard14of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard15of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard16of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard17of18.bin"),
      require("./assets/models/multiclass2/multiclass2-shard18of18.bin"),
    ];
    const multiclass2Model = await tf.loadLayersModel(
      bundleResourceIO(multiclass2Json, multiclass2Weights)
    );
    setMulticlass2Model(multiclass2Model);

    setIsTfReady(true);
  };

  const openImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Error!", "Media access required.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync();
    if (pickerResult.cancelled === true) {
      return;
    }

    setPictureUri(pickerResult.uri);
    processPicture(pickerResult.uri);
  };

  const openCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === "granted") {
      setIsCamera(true);
    } else {
      Alert.alert("Error!", "Camera access required.");
    }
  };

  const toggleCameraType = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const toggleFlashMode = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  const takePicture = async () => {
    const picture = await cameraRef.current.takePictureAsync();
    setPictureUri(picture.uri);
    setIsCamera(false);
    setIsPreview(true);
  };

  const retakePicture = () => {
    setPictureUri(null);
    setIsPreview(false);
    openCamera();
  };

  const processPicture = async (uri) => {
    setIsPreview(false);
    setIsProcessing(true);

    try {
      tf.engine().startScope();

      // Picture
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const buffer = tf.util.encodeString(base64, "base64").buffer;
      const raw = new Uint8Array(buffer);
      const decoded = decodeJpeg(raw);

      // Binary
      const binaryTensor = decoded.resizeBilinear([160, 160]).expandDims(0);
      const binaryPredTensor = binaryModel.predict(binaryTensor) as tf.Tensor;
      const binaryPred =
        1.0 / (1.0 + Math.exp(-binaryPredTensor.dataSync()[0]));
      setMalignantProb(binaryPred);

      // Multiclass 1
      const multiclass1Tensor = decoded
        .resizeBilinear([224, 224])
        .expandDims(0);
      const multiclass1PredTensor = multiclass1Model.predict(
        multiclass1Tensor
      ) as tf.Tensor;
      const multiclass1Pred = multiclass1PredTensor.dataSync();

      // Multiclass 2
      const multiclass2Tensor = decoded
        .resizeBilinear([224, 224])
        .expandDims(0);
      const multiclass2PredTensor = multiclass2Model.predict(
        multiclass2Tensor
      ) as tf.Tensor;
      const multiclass2Pred = multiclass2PredTensor.dataSync();

      // Weighted averge ensemble
      const multiclassProbs = [];
      multiclassProbs.push(
        0.25 * multiclass1Pred[4] + 0.75 * multiclass2Pred[1]
      );
      multiclassProbs.push(
        0.25 * multiclass1Pred[1] + 0.75 * multiclass2Pred[2]
      );
      multiclassProbs.push(
        0.25 * multiclass1Pred[5] + 0.75 * multiclass2Pred[0]
      );
      multiclassProbs.push(
        0.25 * multiclass1Pred[0] + 0.75 * multiclass2Pred[3]
      );
      multiclassProbs.push(
        0.25 * multiclass1Pred[2] + 0.75 * multiclass2Pred[5]
      );
      multiclassProbs.push(
        0.25 * multiclass1Pred[6] + 0.75 * multiclass2Pred[4]
      );
      multiclassProbs.push(
        0.25 * multiclass1Pred[3] + 0.75 * multiclass2Pred[6]
      );
      let softmaxTotal = 0;
      for (const avg of multiclassProbs) {
        softmaxTotal += avg;
      }
      for (let i = 0; i < multiclassProbs.length; i++) {
        multiclassProbs[i] = multiclassProbs[i] / softmaxTotal;
      }
      setMulticlassProbs(multiclassProbs);

      tf.engine().endScope();
    } catch (error) {
      console.error(error);
      setPictureUri(null);
      Alert.alert("Error!", "Something went wrong, please try again.");
    }

    setIsProcessing(false);
  };

  const savePicture = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === "granted") {
      await MediaLibrary.saveToLibraryAsync(pictureUri);
      Alert.alert("Success!", "Your picture has been saved to your gallery.");
    } else {
      Alert.alert("Error!", "Media access required.");
    }
  };

  const toFixedProb = (prob) => {
    return (prob * 100).toFixed(2);
  };

  if (!isTfReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isCamera) {
    return (
      <Camera
        type={cameraType}
        flashMode={flashMode}
        style={styles.camera}
        ref={cameraRef}
      >
        <View style={styles.cameraControls}>
          <TouchableOpacity
            onPress={toggleCameraType}
            style={styles.cameraControlContainer}
          >
            <Text style={styles.cameraControlText}>Flip</Text>
          </TouchableOpacity>
          <View style={styles.cameraControlContainer}>
            <TouchableOpacity
              onPress={takePicture}
              style={styles.takePictureButton}
            />
          </View>
          <TouchableOpacity
            onPress={toggleFlashMode}
            style={styles.cameraControlContainer}
          >
            <Text style={styles.cameraControlText}>
              Flash:{" "}
              {flashMode === Camera.Constants.FlashMode.off ? "off" : "on"}
            </Text>
          </TouchableOpacity>
        </View>
      </Camera>
    );
  }

  if (isPreview) {
    return (
      <ImageBackground
        source={{ uri: pictureUri }}
        style={styles.cameraPreview}
      >
        <View style={styles.cameraControls}>
          <TouchableOpacity
            onPress={retakePicture}
            style={styles.cameraControlContainer}
          >
            <Text style={styles.cameraControlText}>Re-take</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => processPicture(pictureUri)}
            style={styles.cameraControlContainer}
          >
            <Text style={styles.cameraControlText}>Process</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={savePicture}
            style={styles.cameraControlContainer}
          >
            <Text style={styles.cameraControlText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Processing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={styles.title}>Skin Detector</Text>
        <Text style={styles.subtitle}>
          Detect skin conditions quick and easy
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={openImagePicker} style={styles.button}>
            <Text style={styles.buttonText}>Select picture</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openCamera} style={styles.button}>
            <Text style={styles.buttonText}>Take picture</Text>
          </TouchableOpacity>
        </View>
        {pictureUri !== null && multiclassProbs !== null && (
          <React.Fragment>
            <Image source={{ uri: pictureUri }} style={styles.picture} />
            <Text
              style={styles.resultText}
              onPress={() =>
                Alert.alert(
                  "Malignant",
                  "This is the probability that the skin condition is harmful or cancerous."
                )
              }
            >
              Malignant: {toFixedProb(malignantProb)}%
            </Text>
            {multiclassProbs.map((prob, idx) => (
              <Text
                key={`class-${idx}`}
                style={
                  prob === Math.max(...multiclassProbs)
                    ? styles.boldText
                    : styles.normalText
                }
                onPress={() => Alert.alert(CLASSES[idx], DESCRIPTIONS[idx])}
              >
                {CLASSES[idx]}: {toFixedProb(prob)}%
              </Text>
            ))}
          </React.Fragment>
        )}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
  },
  button: {
    width: 150,
    height: 50,
    borderRadius: 4,
    backgroundColor: "#14274e",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  picture: {
    width: 300,
    height: 300,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#14274e",
    borderRadius: 4,
  },
  resultText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  cameraControlContainer: {
    flex: 1,
    alignItems: "center",
  },
  cameraControlText: {
    color: "#fff",
    fontSize: 20,
  },
  takePictureButton: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: "#fff",
  },
  cameraPreview: {
    flex: 1,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  boldText: {
    fontWeight: "bold",
  },
  normalText: {
    fontWeight: "normal",
  },
});
