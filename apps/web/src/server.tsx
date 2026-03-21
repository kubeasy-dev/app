// MUST be first import — initialises OTel SDK before any route loaders
import "./instrumentation";
import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

export default createStartHandler(defaultStreamHandler);
