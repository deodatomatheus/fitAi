import "./App.css";
import { Fragment } from "react";
import { PoseDetection } from "./Components/PoseDetection";
import { ShowDataset } from "./Components/ShowDataset";
import { Navbar, Container, Nav } from "react-bootstrap";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

function App() {
  return (
    <Fragment>
      <Router>
        <Navbar bg="dark" variant="dark">
          <Container>
            <Navbar.Brand>
              <Link to="/">Fitai</Link>
            </Navbar.Brand>
            {/* <Nav className="me-auto">
              <Nav.Link href="/showDataset">show</Nav.Link>
            </Nav> */}
          </Container>
        </Navbar>

        <Switch>
          <Route path="/showDataset">
            <ShowDataset />
          </Route>
          <Route path="/">
            <PoseDetection />
          </Route>
        </Switch>
      </Router>
    </Fragment>
  );
}
export default App;
