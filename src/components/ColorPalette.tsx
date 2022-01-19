
import React, { useState } from 'react';
import { PlayCanvasViewer } from '../playcanvas/playCanvasViewer';
import { SketchPicker, ColorResult } from "react-color";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles(()=>({
  palette: {
    position: "relative",
    width: "250px",
    top: "-330px",
    left: "20px"
  }
}));

function ColorPalette(props: {viewer:PlayCanvasViewer}) {
  const classes = useStyles();
  const [currentColor, setCurrentColor] = useState<string>('#ffffff');  
  function onChange(color:ColorResult, event:React.ChangeEvent<HTMLInputElement>) {
    props.viewer.broadcastEvent("onChange", color, event);
    setCurrentColor(color.hex);
  }
  return (
    <SketchPicker className={classes.palette} color={currentColor} onChange={onChange} />
  );
}

export default ColorPalette;