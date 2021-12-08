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
  Modal,
  Linking,
  ActivityIndicator,
} from "react-native";
import * as tf from "@tensorflow/tfjs";
import { decodeJpeg, bundleResourceIO } from "@tensorflow/tfjs-react-native";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { StatusBar } from "expo-status-bar";

const MODAL_DATA = [
  [
    "Malignancy",
    "This is the probability that the skin condition is harmful or cancerous.",
    "https://en.wikipedia.org/wiki/Malignancy",
  ],
  [
    "Melanoma",
    "The most serious type of skin cancer.",
    "https://en.wikipedia.org/wiki/Melanoma",
  ],
  [
    "Basal Cell Carcinoma",
    "A type of skin cancer that begins in the basal cells.",
    "https://en.wikipedia.org/wiki/Basal-cell_carcinoma",
  ],
  [
    "Melanocytic Nevus",
    "A usually noncancerous disorder of pigment-producing skin cells commonly called birth marks or moles.",
    "https://en.wikipedia.org/wiki/Melanocytic_nevus",
  ],
  [
    "Actinic Keratosis",
    "A rough, scaly patch on the skin caused by years of sun exposure.",
    "https://en.wikipedia.org/wiki/Actinic_keratosis",
  ],
  [
    "Benign Keratosis",
    "A noncancerous skin condition that appears as a waxy brown, black, or tan growth.",
    "https://en.wikipedia.org/wiki/Seborrheic_keratosis",
  ],
  [
    "Vascular Lesions",
    "Relatively common abnormalities of the skin and underlying tissues, more commonly known as birthmarks.",
    "https://en.wikipedia.org/wiki/Skin_condition",
  ],
  [
    "Dermatofibroma",
    "A common benign fibrous nodule usually found on the skin of the lower legs.",
    "https://en.wikipedia.org/wiki/Dermatofibroma",
  ],
];

export default function App() {
  const [isTfReady, setIsTfReady] = useState(false);
  const [binaryModel, setBinaryModel] = useState(null);
  const [multiclassModel, setMulticlassModel] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [malignantProb, setMalignantProb] = useState(0);
  const [multiclassProbs, setMulticlassProbs] = useState(null);
  const cameraRef = useRef(null);
  const [isCamera, setIsCamera] = useState(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [isPreview, setIsPreview] = useState(false);
  const [pictureUri, setPictureUri] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalLink, setModalLink] = useState("");

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
    const binaryJson = require("./assets/models/binary_model.json");
    const binaryWeights = require("./assets/models/binary_model.bin");
    const binaryModel = await tf.loadGraphModel(
      bundleResourceIO(binaryJson, binaryWeights)
    );
    setBinaryModel(binaryModel);

    // Multiclass
    const multiclassJson = require("./assets/models/multiclass_model.json");
    const multiclassWeights = require("./assets/models/multiclass_model.bin");
    const multiclassModel = await tf.loadLayersModel(
      bundleResourceIO(multiclassJson, multiclassWeights)
    );
    setMulticlassModel(multiclassModel);

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

      // Multiclass
      const multiclassTensor = decoded
        .resizeBilinear([32, 32])
        .div(tf.scalar(255))
        .expandDims(0);
      const multiclassPredTensor = multiclassModel.predict(
        multiclassTensor
      ) as tf.Tensor;
      const multiclassPred = multiclassPredTensor.dataSync();
      setMulticlassProbs([
        multiclassPred[4],
        multiclassPred[1],
        multiclassPred[5],
        multiclassPred[0],
        multiclassPred[2],
        multiclassPred[6],
        multiclassPred[3],
      ]);

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
        <Text style={styles.loadingText}>Loading</Text>
        <ActivityIndicator size="large" color="#14274e" />
      </View>
    );
  }

  const showModal = (modalData) => {
    const [title, description, link] = modalData;
    setModalTitle(title);
    setModalDescription(description);
    setModalLink(link);
    setIsModalVisible(true);
  };

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
        <Text style={styles.loadingText}>Processing</Text>
        <ActivityIndicator size="large" color="#14274e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => {
          setIsModalVisible(false);
        }}
      >
        <View style={styles.outerModal}>
          <View style={styles.innerModal}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalDescription}>{modalDescription}</Text>
            <Text
              style={styles.modalLink}
              onPress={() => Linking.openURL(modalLink)}
            >
              Learn more
            </Text>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
              onPress={() => showModal(MODAL_DATA[0])}
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
                onPress={() => showModal(MODAL_DATA[idx + 1])}
              >
                {MODAL_DATA[idx + 1][0]}: {toFixedProb(prob)}%
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
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
  normalText: {
    fontWeight: "normal",
  },
  outerModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  innerModal: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalDescription: {
    marginBottom: 10,
  },
  modalLink: {
    color: "blue",
    marginBottom: 10,
  },
});
