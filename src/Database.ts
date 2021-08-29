import firestore from "./services/firestore";
import firebase from "firebase";

export async function notify() {
  console.log("notify()");
  const docRef = firestore.collection("notification").doc("push");

  try {
    await docRef.set({
      timestamp: firebase.firestore.Timestamp.now(),
    });
    return "successfully notified server";
  } catch (err) {
    console.log("err");
    return err;
  }
}
