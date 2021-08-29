import { useEffect, useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera } from "@mediapipe/camera_utils";
import drawingUtils from "@mediapipe/drawing_utils";
import mpPose, { Landmark } from "@mediapipe/pose";
import { Button, ButtonGroup, ToggleButton, Container } from "react-bootstrap";
import { PoseClassifier } from "../Classifier/PoseClassifier";
import { bakedLandmarks } from "./BakedLandmark";
import { distanceBetweenLineAndPoint } from "../utils/index";
import { EMADictSmoothing } from "../Classifier/EMADictSmoothing";
import { notify } from "../Database";
import "./PoseDetection.css";

export function PoseDetection() {
  const webcamRef = useRef<Webcam>(null);
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const [cameraLoaded, setCameraLoaded] = useState<boolean>(false);
  let canvasCtx: any;
  const [classification, setClassification] = useState<string>("");

  const [status, setStatus] = useState<string>("");
  const [statusNumber, setStatusNumber] = useState<string>("");
  const [statusNumberAux, setStatusNumberAux] = useState<string>("");

  const [usingBakedLandmarks] = useState<boolean>(false); // set to false if you want to use baked landmarks

  const [canAnalyse, setCanAnalyse] = useState<boolean>(false);

  const classifier = new PoseClassifier();
  const smoother = new EMADictSmoothing();

  const [exerciseError, setExerciseError] = useState<boolean>(false);

  useEffect(() => {
    // setClassifier(new PoseClassifier());
  }, []);

  useEffect(() => {
    if (usingBakedLandmarks) {
      drawLandmarksOnCanvas(bakedLandmarks);
      // console.table(classifier?.classify(bakedLandmarks));
    }
  }, []);

  // tracking results callback
  const results = useCallback(({ poseLandmarks }) => {
    if (!poseLandmarks) return;

    //const result = classifier?.classify(poseLandmarks);
    let landmarks: number[][] = classifier
      ?.getEmbedding()
      .getNormalizedBeforeEmbedding(poseLandmarks);
    let names: string[] = classifier?.getEmbedding().getLandmarksNames();
    drawLandmarksOnCanvas(poseLandmarks);

    //if (!result) return;
    if (!landmarks || !names) return;

    let allLandmarksVisible = true;
    poseLandmarks.forEach((l: Landmark) => {
      if (l.visibility !== undefined && l.visibility < 0.65)
        allLandmarksVisible = false;
    });

    if (!allLandmarksVisible) {
      setStatus("corpo inteiro não detectado");
      return;
    }

    let distanceFootKneeX = Math.max(
      Math.abs(
        landmarks[names.indexOf("left_foot_index")][0] -
          landmarks[names.indexOf("left_knee")][0]
      ),
      Math.abs(
        landmarks[names.indexOf("right_foot_index")][0] -
          landmarks[names.indexOf("right_knee")][0]
      )
    );

    let distanceKneeHipY = Math.max(
      Math.abs(
        landmarks[names.indexOf("right_hip")][1] -
          landmarks[names.indexOf("right_knee")][1]
      ),
      Math.abs(
        landmarks[names.indexOf("left_hip")][1] -
          landmarks[names.indexOf("left_knee")][1]
      )
    )

    setStatusNumber(distanceFootKneeX.toFixed(1));

    setStatus(distanceFootKneeX > 10 && distanceKneeHipY < 20 ? "joelhos muito abertos" : "\n");
    setStatusNumberAux(distanceKneeHipY.toFixed(1).toString());
  }, []);

  const drawLandmarksOnCanvas = (landmarks: Landmark[]) => {
    if (!canvasReference) return;
    if (!canvasReference.current) return;

    canvasCtx = canvasReference.current.getContext("2d");

    if (!canvasCtx) return;

    canvasCtx = canvasReference.current
      ? canvasReference.current.getContext("2d")
      : null;

    if (webcamRef.current && webcamRef.current.video) {
      canvasCtx.width = webcamRef.current.video.videoWidth;
      canvasCtx.height = webcamRef.current.video.videoHeight;
      canvasCtx.save();
    }

    canvasCtx.clearRect(
      0,
      0,
      canvasReference.current.width,
      canvasReference.current.height
    );

    if (!landmarks) return;
    // draw
    drawingUtils.drawConnectors(canvasCtx, landmarks, mpPose.POSE_CONNECTIONS, {
      visibilityMin: 0.65,
      color: "white",
    });
    drawingUtils.drawLandmarks(
      canvasCtx,
      Object.values(mpPose.POSE_LANDMARKS_LEFT).map(
        (index) => landmarks[index]
      ),
      { visibilityMin: 0.65, color: "white", fillColor: "rgb(255,138,0)" }
    );
    drawingUtils.drawLandmarks(
      canvasCtx,
      Object.values(mpPose.POSE_LANDMARKS_RIGHT).map(
        (index) => landmarks[index]
      ),
      { visibilityMin: 0.65, color: "white", fillColor: "rgb(0,217,231)" }
    );
    drawingUtils.drawLandmarks(
      canvasCtx,
      Object.values(mpPose.POSE_LANDMARKS_NEUTRAL).map(
        (index) => landmarks[index]
      ),
      { visibilityMin: 0.65, color: "white", fillColor: "white" }
    );
    canvasCtx.restore();
  };

  useEffect(() => {
    if (!cameraLoaded || !webcamRef.current || usingBakedLandmarks) return;

    const pose = new mpPose.Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.4.1624666670/${file}`;
      },
    });

    pose.setOptions({
      selfieMode: true,
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // pose.onResults(onResults);
    pose.onResults(results);
    let camera: Camera;

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video !== null
    ) {
      // @ts-ignore
      camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          // @ts-ignore
          await pose.send({ image: webcamRef.current.video });
        },
        // width: 1280,
        // height: 720,
        facingMode: "environment",
      });
      camera.start();
    }
  }, [cameraLoaded, usingBakedLandmarks]);

  return (
    <Container className="App">
      {/* <ButtonGroup className="mb-2">
        <Button onClick={() => notify()}>Butão meme</Button>
        <ToggleButton
          id="toggle-check"
          type="checkbox"
          variant="secondary"
          checked={canAnalyse}
          value="1"
          onChange={(e) => setCanAnalyse(e.currentTarget.checked)}
        >
          analyse
        </ToggleButton>
      </ButtonGroup> */}

      <div className="inner-container">
        <Webcam
          className="webcam"
          audio={false}
          ref={webcamRef}
          mirrored={true}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "environment",
          }}
          onUserMedia={() => {
            // navigator.mediaDevices.enumerateDevices().then(console.log);
            setCameraLoaded(true);
          }}
        />
        <canvas ref={canvasReference} className="output-canvas" />
      </div>

      <h2>
        <code>{statusNumber}</code>
        <br />
        <code>{statusNumberAux}</code>
        <br />
        <code>{status}</code>
      </h2>
    </Container>
  );
}
