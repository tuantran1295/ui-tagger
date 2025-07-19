import React from "react";
import { Rect, Text } from "react-konva";

// For displaying LLM-predicted bounding boxes
const LLMBox = ({ box, tag }) => (
    <>
        <Rect
            x={box[0]}
            y={box[1]}
            width={box[2]}
            height={box[3]}
            stroke="green"
            strokeWidth={2}
            dash={[2, 2]}
        />
        <Text
            x={box[0]}
            y={box[1] - 16}
            text={tag + " (LLM)"}
            fill="green"
            fontSize={13}
        />
    </>
);

export default LLMBox;