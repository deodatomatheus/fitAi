import {
  normL2,
  matrixNormL2,
  sub,
  scaleArray,
  convertLandmarkToMatrix,
  sum,
} from "../utils";
import { Landmark } from "@mediapipe/pose";

/**
 * @class FullBodyPoseEmbedder
 * @brief Converts 3D pose landmarks into 3D embedding.
 */
export class FullBodyPoseEmbedder {
  private _landmarkNames: string[]; //<! Names of the landmarks as they appear in the prediction.
  private _torsoSizeMultiplier: number;
  private canPrint = true;

  /**
   * @brief Constructor for the class
   * @param sizeMultiplier The multiplier that will be used in the normalized representation
   */
  constructor(sizeMultiplier: number = 2.5) {
    this._torsoSizeMultiplier = sizeMultiplier;
    this._landmarkNames = [
      "nose",
      "left_eye_inner",
      "left_eye",
      "left_eye_outer",
      "right_eye_inner",
      "right_eye",
      "right_eye_outer",
      "left_ear",
      "right_ear",
      "mouth_left",
      "mouth_right",
      "left_shoulder",
      "right_shoulder",
      "left_elbow",
      "right_elbow",
      "left_wrist",
      "right_wrist",
      "left_pinky_1",
      "right_pinky_1",
      "left_index_1",
      "right_index_1",
      "left_thumb_2",
      "right_thumb_2",
      "left_hip",
      "right_hip",
      "left_knee",
      "right_knee",
      "left_ankle",
      "right_ankle",
      "left_heel",
      "right_heel",
      "left_foot_index",
      "right_foot_index",
    ];
  }

  /**
   * @brief Normalizes landmarks translation and scale.
   * @param landmarks A vector of landmarks
   * @return The normalized vector
   */
  normalizePoseLandmarks(landmarks: number[][]): number[][] {
    let poseCenter: number[] = this.getPoseCenter(landmarks);

    // get distance of each landmark from center
    landmarks = landmarks.map((landmark: number[]) => {
      return sub(landmark, poseCenter);
    });

    let poseSize: number = this.getPoseSize(
      landmarks,
      this._torsoSizeMultiplier
    );

    // divide array by scalar
    landmarks = landmarks.map((elem: number[]) =>
      scaleArray(elem, 1.0 / poseSize)
    );

    // multiply array by scalar
    landmarks = landmarks.map((elem: number[]) => scaleArray(elem, 100));

    return landmarks;
  }

  /**
   * @brief Calls the PoseEmbedder funcionalite
   * @param landmarks The current landmarks
   * @return The embedding for the @p landmarks
   */
  public call(landmarks: Landmark[] | number[][]) {
    // convert mpPose landmark object to number matrix.
    landmarks = convertLandmarkToMatrix(landmarks as Landmark[]) as number[][];

    console.assert(
      landmarks.length === this._landmarkNames.length,
      "Shape dos landmarks não está certo"
    );

    // Normalize landmarks.
    landmarks = this.normalizePoseLandmarks(landmarks);

    //# Get embedding.
    let embedding: any = this.getPoseDistanceEmbedding(landmarks);

    return embedding;
  }

  /**
   * @brief Gets the center pose of a array of @p landmarks
   * @param landmarks A array of landmarks
   * @return The central pose in the array
   */
  getPoseCenter(landmarks: number[][]): number[] {
    let leftHip: number[] = landmarks[this._landmarkNames.indexOf("left_hip")];
    let rightHip: number[] =
      landmarks[this._landmarkNames.indexOf("right_hip")];

    return scaleArray(sum(leftHip, rightHip), 0.5); // todo: make a more generic approx from this, the code will not work, because in some places we need three coordenates, althrough other we need only two
  }

  /**
   * @brief Calculates the pose size
   * @param landmarks A vector of landmarks
   * @param torsoSizeMultiplier A number to represent the multiplicator factor for the torso
   * @return The maximum of two values: the distance between the pose center to any pose landmark and the torso size * @p torsoSizeMultiplier
   */
  getPoseSize(landmarks: number[][], torsoSizeMultiplier: number) {
    // This approach uses only 2D landmarks to compute pose size.
    landmarks = landmarks.map((elem: number[]) => [elem[0], elem[1]]);

    // Hips center.
    let leftHip: number[] = landmarks[this._landmarkNames.indexOf("left_hip")];
    let rightHip: number[] =
      landmarks[this._landmarkNames.indexOf("right_hip")];

    let hips: number[] = scaleArray(sum(leftHip, rightHip), 0.5);

    // Shoulders center.
    let leftShoulder: number[] =
      landmarks[this._landmarkNames.indexOf("left_shoulder")];
    let rightShoulder: number[] =
      landmarks[this._landmarkNames.indexOf("right_shoulder")];

    let shoulders: number[] = scaleArray(sum(leftShoulder, rightShoulder), 0.5);

    // Torso size as the minimum body size.
    let torsoSize: number = normL2(sub(shoulders, hips));

    // Max dist to pose center.
    let poseCenter: number[] = this.getPoseCenter(landmarks);
    let maxDist: number = -Infinity;
    //let maxDist: any = np.max(np.linalg.norm(landmarks - poseCenter, axis=1));

    let normalizedVector: number[] = matrixNormL2(
      landmarks.map((landmark: number[]) => sub(landmark, poseCenter))
    );

    maxDist = Math.max(...normalizedVector);

    /*
      This line tries to remove the center pose from the landmarks
    */

    return Math.max(torsoSize * torsoSizeMultiplier, maxDist);
  }

  getPoseDistanceEmbedding(landmarks: number[][]) {
    // Converts pose landmarks into 3D embedding.

    // We use several pairwise 3D distances to form pose embedding. All distances
    // include X and Y components with sign. We differnt types of pairs to cover
    // different pose classes. Feel free to remove some or add new.

    // Args:
    //   landmarks - NumPy array with 3D landmarks of shape (N, 3).

    // Result:
    //   Numpy array with pose embedding of shape (M, 3) where `M` is the number of
    //   pairwise distances.

    const embedding = [
      // One joint.

      this.getDistance(
        this.getAverageByNames(landmarks, "left_hip", "right_hip"),
        this.getAverageByNames(landmarks, "left_shoulder", "right_shoulder")
      ),

      this.getDistanceByNames(landmarks, "left_shoulder", "left_elbow"),
      this.getDistanceByNames(landmarks, "right_shoulder", "right_elbow"),

      this.getDistanceByNames(landmarks, "left_elbow", "left_wrist"),
      this.getDistanceByNames(landmarks, "right_elbow", "right_wrist"),

      this.getDistanceByNames(landmarks, "left_hip", "left_knee"),
      this.getDistanceByNames(landmarks, "right_hip", "right_knee"),

      this.getDistanceByNames(landmarks, "left_knee", "left_ankle"),
      this.getDistanceByNames(landmarks, "right_knee", "right_ankle"),

      // Two joints.

      this.getDistanceByNames(landmarks, "left_shoulder", "left_wrist"),
      this.getDistanceByNames(landmarks, "right_shoulder", "right_wrist"),

      this.getDistanceByNames(landmarks, "left_hip", "left_ankle"),
      this.getDistanceByNames(landmarks, "right_hip", "right_ankle"),

      // Four joints.

      this.getDistanceByNames(landmarks, "left_hip", "left_wrist"),
      this.getDistanceByNames(landmarks, "right_hip", "right_wrist"),

      // Five joints.

      this.getDistanceByNames(landmarks, "left_shoulder", "left_ankle"),
      this.getDistanceByNames(landmarks, "right_shoulder", "right_ankle"),

      this.getDistanceByNames(landmarks, "left_hip", "left_wrist"),
      this.getDistanceByNames(landmarks, "right_hip", "right_wrist"),

      // Cross body.

      this.getDistanceByNames(landmarks, "left_elbow", "right_elbow"),
      this.getDistanceByNames(landmarks, "left_knee", "right_knee"),

      this.getDistanceByNames(landmarks, "left_wrist", "right_wrist"),
      this.getDistanceByNames(landmarks, "left_ankle", "right_ankle"),
    ];
    // Body bent direction.

    // this.getDistance(
    //     this.getAverageByNames(landmarks, 'left_wrist', 'left_ankle'),
    //     landmarks[this.landmark_names.index('left_hip')]),
    // this.getDistance(
    //     this.getAverageByNames(landmarks, 'right_wrist', 'right_ankle'),
    //     landmarks[this.landmark_names.index('right_hip')]),

    return embedding;
  }

  /**
   * @brief Calculates the average between two landmarks by it's names
   * @param landmarks A vector of landmarks
   * @param nameFrom A landmark from we are as a name
   * @param nameTo A landmark where we goes as a name
   * @return The average between @p nameTo, @p nameFrom
   */
  getAverageByNames(landmarks: number[][], nameFrom: string, nameTo: string) {
    const landmarkFrom: number[] =
      landmarks[this._landmarkNames.indexOf(nameFrom)]; // todo: see if this is the equivalent function
    const landmarkTo: number[] = landmarks[this._landmarkNames.indexOf(nameTo)];

    let avgLandmark: any = [];

    for (let i = 0; i < landmarkFrom.length; i++) {
      avgLandmark.push(landmarkFrom[i] + landmarkTo[i]);
    }

    return avgLandmark.map((x: number) => x * 0.5); // todo: check if it's correct (compare with approach below)
    // return (lmk_from + lmk_to) * 0.5 (python version)
  }

  /**
   * @brief Calculates the distance between two landmarks by it's names
   * @param landmarks A vector of landmarks
   * @param nameFrom A landmark from we are as a name
   * @param nameTo A landmark where we goes as a name
   * @return The distance between @p nameTo, @p nameFrom
   */
  getDistanceByNames(landmarks: number[][], nameFrom: string, nameTo: string) {
    const lmkFrom: number[] = landmarks[this._landmarkNames.indexOf(nameFrom)];
    const lmkTo: number[] = landmarks[this._landmarkNames.indexOf(nameTo)];
    return this.getDistance(lmkFrom, lmkTo);
  }

  /**
   * @brief Calculates the distance between two landmarks
   * @param landmarkFrom A landmark from we are
   * @param landmarkTo A landmark where we goes
   * @return The distance between @p landmarkTo, @p landmarkFrom
   */
  getDistance(landmarkFrom: number[], landmarkTo: number[]) {
    let distance: any = [];

    for (let i = 0; i < landmarkFrom.length; i++) {
      distance.push(landmarkTo[i] - landmarkFrom[i]);
    }

    return distance; // todo: see if this subtracts all diementions
  }


  public getNormalizedBeforeEmbedding(landmarks: Landmark[] | number[][]) {
    landmarks = convertLandmarkToMatrix(landmarks as Landmark[]) as number[][];

    console.assert(
      landmarks.length === this._landmarkNames.length,
      "Shape dos landmarks não está certo"
    );

    // Normalize landmarks.
    landmarks = this.normalizePoseLandmarks(landmarks);

    return landmarks;
  }

  public getLandmarksNames() {
    return this._landmarkNames;
  }
}
