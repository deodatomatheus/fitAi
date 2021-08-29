import { Landmark } from "@mediapipe/pose";

/**
 * @brief Returns a Norm (L2) from a given vector @p arr
 * @param arr A array where the norm will be calculated
 * @return The L2 norm of @p arr
 */
export function normL2(arr: number[]): number {
  let sum: number = 0;

  for (let i = 0; i < arr.length; i++) {
    sum += Math.pow(arr[i], 2);
  }

  return Math.sqrt(sum);
}

/**
 * @brief Returns a Norm (L2) from a given matrix @p matrix
 * @param matrix A matrix where the norm will be calculated
 * @return A vector with the L2 norm of the axis 1 in @p matrix
 */
export function matrixNormL2(matrix: number[][]): number[] {
  let normalizedVector: number[] = [];

  for (let i = 0; i < matrix.length; i++) {
    normalizedVector.push(normL2(matrix[i]));
  }

  return normalizedVector;
}

/**
 * @brief Removes the first instance of @p value in the @p arr
 * @param arr A Array of alements
 * @param value A element to be removed
 * @return The same array without the first instance of @p value
 */
export function removeItemOnce(arr: any[], value: any) {
  var index: any = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }

  return arr;
}

/**
 * @brief Removes all instances of @p value in the @p arr
 * @param arr A Array of alements
 * @param value A element to be removed
 * @return The same array without all instances of @p value
 */
export function removeItemAll(arr: any[], value: any) {
  var i = 0;
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }

  return arr;
}

/**
 * @brief
 * This function calculates the Euclidian Distance between points.
 *
 * @param pointA A array of numbers representing the coordenates of the first point in each @p dimention .
 * @param pointB A array of numbers representing the coordenates of the second point in each @p dimention .
 * @param dimention The dimention that is used in both points
 */
export function euclidianDistance(
  pointA: number[],
  pointB: number[],
  dimention: number
): number {
  //assert(pointA.length == dimention);
  //assert(pointB.length == dimention);

  let sum: number = 0;

  for (let i = 0; i < dimention; i++) {
    sum += Math.pow(pointA[i] - pointB[i], 2);
  }

  return Math.sqrt(sum);
}

export function convertLandmarkToMatrix(landmarks: Landmark[]): number[][] {
  return landmarks.map((l: Landmark) => [l.x, l.y, l.z]);
}

export function sum(a: number[], b: number[]): number[] {
  let result: number[] = [];
  for (let i = 0; i < a.length; i++) {
    result.push(a[i] + b[i]);
  }

  return result;
}

export function sub(a: number[], b: number[]): number[] {
  let result: number[] = [];
  for (let i = 0; i < a.length; i++) {
    result.push(a[i] - b[i]);
  }

  return result;
}

export function subMatrix(a: number[][], b: number[][]): number[][] {
  let result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result.push(sub(a[i], b[i]));
  }

  return result;
}

export function mult(a: number[], b: number[]): number[] {
  let result: number[] = [];
  for (let i = 0; i < a.length; i++) {
    result.push(a[i] * b[i]);
  }

  return result;
}

export function multMatrix(a: number[][], b: number[][]): number[][] {
  let result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result.push(mult(a[i], b[i]));
  }
  return result;
}

export function dotMatrixByVector(a: number[][], b: number[]): number[] {
  let result: number[] = [];
  console.assert(a.length > 0 && a[0].length === b.length);

  for (let i = 0; i < a.length; i++) {
    let elem: number = 0;
    for (let j = 0; j < a[i].length; j++) {
      elem += a[i][j] * b[j];
    }
    result.push(elem);
  }

  return result;
}

export function multMatrixByVector(a: number[][], b: number[]): number[][] {
  let result: number[][] = [];
  console.assert(a.length > 0 && a[0].length === b.length);

  for (let i = 0; i < a.length; i++) {
    let row: number[] = [];
    for (let j = 0; j < a[i].length; j++) {
      row.push(a[i][j] * b[j]);
    }
    result.push(row);
  }

  return result;
}

export function scaleArray(a: number[], b: number): number[] {
  let result: number[] = [];
  for (let i = 0; i < a.length; i++) {
    result.push(a[i] * b);
  }
  return result;
}

export function div(a: number[], b: number[]): number[] {
  let result: number[] = [];
  for (let i = 0; i < a.length; i++) {
    result.push(a[i] / b[i]);
  }

  return result;
}

export function abs(a: number[]): number[] {
  let result: number[] = [];
  for (let i = 0; i < a.length; i++) {
    result.push(Math.abs(a[i]));
  }

  return result;
}

export function absMatrix(a: number[][]): number[][] {
  let result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result.push(abs(a[i]));
  }

  return result;
}

export function maxMatrix(a: number[][]): number {
  let max: number = -Infinity;

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[i].length; j++) {
      max = Math.max(max, a[i][j]);
    }
  }
  return max;
}

export function mean(a: number[]): number {
  let result: number = 0;
  for (let i = 0; i < a.length; i++) {
    result += a[i];
  }

  return result / a.length;
}

export function meanMatrix(a: number[][]): number {
  let result: number = 0;
  for (let i = 0; i < a.length; i++) {
    result += mean(a[i]);
  }

  return result / a.length;
}

export function maxOnAxisZero(a: number[], b: number[]) {
  let result: number[] = [];
  for (let i = 0; i < a.length; i++) {
    result.push(Math.max(a[i], b[i]));
  }

  return result;
}

/**
 * @brief converts pose data to an array of landmarks
 * @param data An string representing the pose. Should be structured as "sample_00001,x1,y1,z1,x2,y2,z2,...."
 * @return An object containing pose's landmarks, pose's name, and its class
 */
export function loadPose(data: string): {
  landmarks: Landmark[];
  name: string;
  className: string;
} {
  const row = data.split(",");
  let landmarks: Landmark[] = [];
  let tmp_landmark: Landmark = { x: NaN, y: NaN, z: NaN };

  // assert that data has 93 values (33 landmarks * 3 dimensios-xyz)
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

  return { landmarks, name: row[0], className: row[1] };
}

/**
 * @brief Get the smallest distance between one line and two points.
 * @param pointA One point in the line
 * @param pointB Other point in the line
 * @param point The point
 * @return The smallest distance between one line and two points
 */
export function distanceBetweenLineAndPoint(
  pointA: number[],
  pointB: number[],
  point: number[]
): number {
  return (
    Math.abs(
      (pointB[0] - pointA[0]) * (pointA[1] - point[1]) -
        (pointA[0] - point[0]) * (pointB[1] - pointA[1])
    ) /
    Math.sqrt(
      (pointB[0] - pointA[0]) * (pointB[0] - pointA[0]) -
        (pointB[1] - pointA[1]) * (pointB[1] - pointA[1])
    )
  );
}
