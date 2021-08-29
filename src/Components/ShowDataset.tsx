import React, { useEffect, useRef, useState } from "react";
import { data as data } from "../assets/fitness_poses_csvs_out_basic";
import { loadPose } from "../utils";
import {
  InputGroup,
  FormControl,
  Button,
  Form,
  FormGroup,
} from "react-bootstrap";
import mpPose, { Landmark } from "@mediapipe/pose";
import drawingUtils from "@mediapipe/drawing_utils";
import "./ShowDataset.css";

export function ShowDataset() {
  const canvasReference = useRef<HTMLCanvasElement>(null);
  let canvasCtx: any;

  const [form, setForm] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [errorFeedback, setErrorFeedback] = useState<string>("");

  const [sampleInfo, setSampleInfo] = useState<string>("");

  useEffect(() => {
    let landmarks: Landmark[] = loadPose(data.split("\n")[1]).landmarks;
  });

  function handleLandmarks(landmarks: Landmark[]): Landmark[] {
    return landmarks.map((l: Landmark) => {
      return { x: l.x / 1920, y: l.y / 1080, z: l.z };
    });
  }

  // const handleLandmarks = (landmarks : Landmark[]) => landmarks.map((l: Landmark) => { x: l.x / 1920, y: l.y / 1080, z: l.z })

  const drawLandmarksOnCanvas = (landmarks: Landmark[]) => {
    if (!canvasReference || !canvasReference.current || !landmarks) return;

    canvasCtx = canvasReference.current.getContext("2d");

    if (!canvasCtx) return;

    canvasCtx = canvasReference.current
      ? canvasReference.current.getContext("2d")
      : null;

    canvasCtx.clearRect(
      0,
      0,
      canvasReference.current.width,
      canvasReference.current.height
    );

    // console.table(landmarks);

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

  const handleForm = (value: string) => {
    setForm(value);
    console.log(form);

    setIsValid(validateInput(value));
    if (!isValid) return;

    const { landmarks, name, className } = loadPose(value);

    drawLandmarksOnCanvas(handleLandmarks(landmarks));
    setSampleInfo(`{${name}, ${className}}`);
  };

  const validateInput = (text: string): boolean => {
    if (text === "") return true;

    const row = text.split(",");
    if (row.length !== 33 * 3 + 2) {
      setErrorFeedback(
        `Texto possui ${row.length} componentes. Necessita de 101`
      );
      return false;
    }

    return true;
  };

  return (
    <div className="main">
      <h1>show pose</h1>

      <FormGroup role="form">
        <Form.Control
          placeholder={`Pose data. ex \"sample_01,fase_1,x1,y1,z1,x2,y2,z2...\"`}
          aria-label="Pose data"
          value={form}
          onChange={(e: any) => handleForm(e.target.value)}
          isInvalid={!isValid}
        />
        <Form.Control.Feedback type="invalid">
          {errorFeedback}
        </Form.Control.Feedback>
      </FormGroup>

      <canvas
        className="output_canvas"
        ref={canvasReference}
        // style={{
        //   width: 1280 / 2,
        //   height: 720 / 2,
        //   //   borderWidth: 10,
        //   //   borderColor: "black",
        //   //   backgroundColor: "lightpink",
        // }}
      />
      <p style={{ fontFamily: "monospace" }}>{sampleInfo}</p>
    </div>
  );
}
