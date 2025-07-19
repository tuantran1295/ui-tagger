import React from "react";
import { Rect, Text } from "react-konva";

const AnnotationBox = ({
                           shapeProps,
                           isSelected,
                           onSelect,
                           onChange,
                           index,
                           onDelete,
                           tag,
                       }) => (
    <>
        <Rect
            onClick={onSelect}
            {...shapeProps}
            stroke={isSelected ? "red" : "purple"}
            strokeWidth={2}
            dash={[5, 3]}
            draggable
            onDragEnd={(e) => {
                onChange({
                    ...shapeProps,
                    x: e.target.x(),
                    y: e.target.y(),
                });
            }}
            onTransformEnd={(e) => {
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                onChange({
                    ...shapeProps,
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(5, node.width() * scaleX),
                    height: Math.max(5, node.height() * scaleY),
                });
            }}
        />
        <Text
            x={shapeProps.x}
            y={shapeProps.y - 18}
            text={tag}
            fill="blue"
            fontSize={16}
            fontStyle="bold"
        />
        {isSelected && (
            <Text
                x={shapeProps.x + shapeProps.width - 40}
                y={shapeProps.y - 18}
                text="[del]"
                fill="red"
                fontSize={13}
                onClick={() => onDelete(index)}
            />
        )}
    </>
);

export default AnnotationBox;