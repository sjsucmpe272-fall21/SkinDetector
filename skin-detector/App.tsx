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

export default function App() {
  const [isTfReady, setIsTfReady] = useState(false);
  const [binaryModel, setBinaryModel] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [malignantProb, setMalignantProb] = useState(0);
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
    const modelWeights = require("./assets/models/binary_melanoma/binary_melanoma.bin");
    const modelJson = require("./assets/models/binary_melanoma/binary_melanoma.json");
    const model = await tf.loadGraphModel(
      bundleResourceIO(modelJson, modelWeights)
    );
    setBinaryModel(model);
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
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const buffer = tf.util.encodeString(base64, "base64").buffer;
    const raw = new Uint8Array(buffer);
    const tensor = decodeJpeg(raw).resizeBilinear([160, 160]).expandDims(0);
    const predTensor = binaryModel.predict(tensor) as tf.Tensor;
    const pred = 1.0 / (1.0 + Math.exp(-predTensor.dataSync()[0]));
    setMalignantProb(pred);
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
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={openImagePicker} style={styles.button}>
            <Text style={styles.buttonText}>Select picture</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openCamera} style={styles.button}>
            <Text style={styles.buttonText}>Take picture</Text>
          </TouchableOpacity>
        </View>
        {pictureUri !== null && (
          <React.Fragment>
            <Text style={styles.resultText}>
              Malignant probability: {(malignantProb * 100).toFixed(2)}%
            </Text>
            <Image source={{ uri: pictureUri }} style={styles.picture} />
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
  resultText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 50,
  },
  picture: {
    width: 300,
    height: 300,
    marginTop: 20,
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
});
