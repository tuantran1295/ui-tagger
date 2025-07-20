import React from "react";
import { Rect, Text, Group } from "react-konva";

// For displaying LLM-predicted bounding boxes
const LLMBox = ({ box, tag }) => (
    <Group>
        {/* Bounding rectangle */}
        <Rect
            x={box[0]}
            y={box[1]}
            width={box[2]}
            height={box[3]}
            stroke="green"
            strokeWidth={2}
            dash={[2, 2]}
        />
        {/* Tag "background" for better visibility
        <Rect
            x={box[0]}
            y={box[1] - 20}
            width={Math.max(50, tag.length * 8)}
            height={18}
            fill="white"
            opacity={0.7}
            listening={false}
        />
        */}
        {/* Tag */}
        <Text
            x={box[0] + 4}
            y={box[1] - 16}
            text={tag + " (LLM)"}
            fill="green"
            fontSize={13}
            background="white"
            fontStyle="bold"
        />
    </Group>
);

export default LLMBox;