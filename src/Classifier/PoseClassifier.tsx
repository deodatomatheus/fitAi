import { dataSimple as data } from "../assets/fitness_poses_csvs_out_basic";
import { FullBodyPoseEmbedder } from "./FullBodyPoseEmbedder";
import { Landmark } from "@mediapipe/pose";
import {
  subMatrix,
  absMatrix,
  multMatrixByVector,
  maxMatrix,
  meanMatrix
} from "../utils";

export interface PoseSample {
  name: string;
  landmarks: Landmark[];
  class_name: string;
  embedding: any;
}

export interface PoseSampleOutlier {
  sample: any;
  detected_class: any;
  all_classes: any[];
}

export class PoseClassifier {
  // Classifies pose landmarks.
  poseEmbedder: FullBodyPoseEmbedder = new FullBodyPoseEmbedder();
  topNByMaxDistance: number;
  topNNyMeanDistance: number;
  axesWeights: number[];
  poseSamples: any[];

  constructor(
    topNByMaxDistance: number = 30,
    topNNyMeanDistance: number = 10,
    axes_weights: number[] = [1, 1, 0.2]
  ) {
    this.poseEmbedder = new FullBodyPoseEmbedder();
    this.topNByMaxDistance = topNByMaxDistance;
    this.topNNyMeanDistance = topNNyMeanDistance;
    this.axesWeights = axes_weights;

    this.poseSamples = this.loadPoseSamples();
  }

  loadPoseSamples() {
    // Loads pose samples from a given folder.

    // Required folder structure:
    //   neutral_standing.csv
    //   pushups_down.csv
    //   pushups_up.csv
    //   squats_down.csv
    //   ...

    // Required CSV structure:
    //   sample_00001,x1,y1,z1,x2,y2,z2,....
    //   sample_00002,x1,y1,z1,x2,y2,z2,....
    //   ...

    // Each file in the folder represents one pose class.

    // todo: only works for one file, not N
    // const data = fs.readFileSync(
    //   "../assets/fitness_poses_csvs_out_basic.csv",
    //   "utf-8"
    // );
    let pose_samples: PoseSample[] = [];
    data.split("\n").forEach((line: string, i: number) => {
      if (i === 0) return;

      const row = line.split(",");
      let landmarks: Landmark[] = [];
      let tmp_landmark: Landmark = { x: NaN, y: NaN, z: NaN };

      console.assert(row.slice(2).length === 33 * 3);

      row.slice(2).forEach((item: string, i: number) => {
        switch (i % 3) {
          case 0:
            tmp_landmark.x = parseFloat(item);
            break;
          case 1:
            tmp_landmark.y = parseFloat(item);
            break;
          case 2:
            tmp_landmark.z = parseFloat(item);
            landmarks.push(tmp_landmark);
            tmp_landmark = { x: NaN, y: NaN, z: NaN };
            break;
          default:
            break;
        }
      });

      pose_samples.push({
        landmarks: landmarks,
        embedding: this.poseEmbedder.call(landmarks),
        name: row[0],
        class_name: row[1],
      });
    });

    return pose_samples;

    // TODO: CSV PARSE
    // file_names = [name for name in os.listdir(pose_samples_folder) if name.endswith(file_extension)]

    // pose_samples = []
    // for file_name in file_names:
    //   // Use file name as pose class name.
    //   class_name = file_name[:-(len(file_extension) + 1)]

    //   // Parse CSV.
    //   with open(os.path.join(pose_samples_folder, file_name)) as csv_file:
    //     csv_reader = csv.reader(csv_file, delimiter=file_separator)
    //     for row in csv_reader:
    //       assert len(row) == n_landmarks * n_dimensions + 1, 'Wrong number of values: {}'.format(len(row))
    //       landmarks = np.array(row[1:], np.float32).reshape([n_landmarks, n_dimensions])
    //       pose_samples.append(PoseSample(
    //           name=row[0],
    //           landmarks=landmarks,
    //           class_name=class_name,
    //           embedding=pose_embedder(landmarks),
    //       ))

    // return pose_samples
  }

  find_pose_sample_outliers() {
    // Classifies each sample against the entire database.
    // Find outliers in target poses
    let outliers: PoseSampleOutlier[] = [];
    this.poseSamples.forEach((sample: any) => {
      // Find nearest poses for the target one.
      let pose_landmarks = sample.landmarks;
      const pose_classification = this.classify(pose_landmarks);

      // todo: check with line below
      let class_names = pose_classification
        .items()
        .filter((item: any) => item.count === pose_classification.values());
      // class_names = [class_name for class_name, count in pose_classification.items() if count == max(pose_classification.values())]

      // todo: check with if statement below
      // Sample is an outlier if nearest poses have different class or more than
      // one pose class is detected as nearest.
      if (!class_names.includes(sample.class_name) || class_names.len !== 1) {
        outliers.push({
          sample: sample,
          detected_class: class_names,
          all_classes: pose_classification,
        });
      }
      // if (sample.class_name not in class_names or len(class_names) != 1){
      //   outliers.append(PoseSampleOutlier(sample, class_names, pose_classification))
      // }
    });

    return outliers;
  }

  classify(pose_landmarks: Landmark[]) {
    // Classifies given pose.

    // Classification is done in two stages:
    //   * First we pick top-N samples by MAX distance. It allows to remove samples
    //     that are almost the same as given pose, but has few joints bent in the
    //     other direction.
    //   * Then we pick top-N samples by MEAN distance. After outliers are removed
    //     on a previous step, we can pick samples that are closes on average.

    // Args:
    //   pose_landmarks: NumPy array with 3D landmarks of shape (N, 3).

    // Returns:
    //   Dictionary with count of nearest pose samples from the database. Sample:
    //     {
    //       'pushups_down': 8,
    //       'pushups_up': 2,
    //     }
    //

    // TODO:
    // Check that provided and target poses have the same shape.
    // assert pose_landmarks.shape == (this._n_landmarks, this._n_dimensions), 'Unexpected shape: {}'.format(pose_landmarks.shape)

    // Get given pose embedding.
    let pose_embedding: any = this.poseEmbedder.call(pose_landmarks);

    // let flipped = ;

    let flipped_pose_embedding = this.poseEmbedder.call(
      pose_landmarks.map((landmark: Landmark) => {
        return {
          x: landmark.x * -1,
          y: landmark.y,
          z: landmark.z,
          visibility: landmark.visibility,
        };
      })
    );

    // Filter by max distance.
    //
    // That helps to remove outliers - poses that are almost the same as the
    // given one, but has one joint bent into another direction and actually
    // represnt a different pose class.
    // todo: check all code below!!!
    // let max_dist_heap: { dist: number; index: number }[] = [];
    let max_dist_heap: number[][] = [];

    this.poseSamples.map((sample: any, i: number) => {
      let max_dist = Math.min(
        maxMatrix(
          absMatrix(
            multMatrixByVector(
              subMatrix(sample.embedding, pose_embedding),
              this.axesWeights
            )
          )
        ),
        maxMatrix(
          absMatrix(
            multMatrixByVector(
              subMatrix(sample.embedding, flipped_pose_embedding),
              this.axesWeights
            )
          )
        )
      );
      max_dist_heap.push([max_dist, i]);
    });

    max_dist_heap = max_dist_heap.sort(
      (first: number[], second: number[]) => first[0] - second[0]
    );
    max_dist_heap = max_dist_heap.slice(0, this.topNByMaxDistance);

    // for sample_idx, sample in enumerate(this._pose_samples):
    //   max_dist = min(
    //       np.max(np.abs(sample.embedding - pose_embedding) * this._axes_weights),
    //       np.max(np.abs(sample.embedding - flipped_pose_embedding) * this._axes_weights),
    //   )
    //   max_dist_heap.append([max_dist, sample_idx])

    // max_dist_heap = sorted(max_dist_heap, key=lambda x: x[0])
    // max_dist_heap = max_dist_heap[:this._top_n_by_max_distance]

    // Filter by mean distance.
    //
    // After removing outliers we can find the nearest pose by mean distance.
    let mean_dist_heap: any[] = []; // todo: fix this type
    max_dist_heap.map(([_, index]: number[]) => {
      // let sample_idx = item.sample_idx;
      let sample = this.poseSamples[index];
      let mean_dist = Math.min(
        meanMatrix(
          absMatrix(
            multMatrixByVector(
              subMatrix(sample.embedding, pose_embedding),
              this.axesWeights
            )
          )
        ),
        meanMatrix(
          absMatrix(
            multMatrixByVector(
              subMatrix(sample.embedding, flipped_pose_embedding),
              this.axesWeights
            )
          )
        )
      );
      mean_dist_heap.push([mean_dist, index]);
    });

    mean_dist_heap = mean_dist_heap.sort(
      (first: number[], second: number[]) => first[0] - second[0]
    );
    mean_dist_heap = mean_dist_heap.slice(0, this.topNNyMeanDistance);

    let class_names = mean_dist_heap.map(
      ([_, index]: number[]) => this.poseSamples[index].class_name
    );

    let result: any = {};
    class_names.forEach((item: string) => {
      if (item in result) {
        result[item] += 1;
      } else {
        result[item] = 1;
      }
    });

    return result;
  }

  public getEmbedding() {
    return this.poseEmbedder;
  }
}
