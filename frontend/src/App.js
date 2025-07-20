import React, { useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import {
    Box,
    Button,
    MenuItem,
    Select,
    Typography,
    Stack,
} from "@mui/material";
import AnnotationBox from "./AnnotationBox";
import LLMBox from "./LLMBox";
import { TAGS } from "./tagList";

// Main App
function App() {
    const [imgUrl, setImgUrl] = useState(null);
    const [annotations, setAnnotations] = useState([]);
    const [llmAnnotations, setLlmAnnotations] = useState([]);
    const [drawingBox, setDrawingBox] = useState(null);
    const [currentTag, setCurrentTag] = useState(TAGS[0]);
    const [selectedId, setSelectedId] = useState(null);

    const [image] = useImage(imgUrl);
    const stageRef = useRef();

    // Draw box: mouse handlers
    const handleMouseDown = (e) => {
        if (!image) return;
       // if (e.target !== e.target.getStage()) return;
        const { x, y } = e.target.getStage().getPointerPosition();
        setDrawingBox({ x, y, width: 0, height: 0 });
    };

    const handleMouseMove = (e) => {
        if (!drawingBox || !image) return;
        const { x, y } = e.target.getStage().getPointerPosition();
        setDrawingBox({
            ...drawingBox,
            width: x - drawingBox.x,
            height: y - drawingBox.y,
        });
    };

    const handleMouseUp = () => {
        if (
            drawingBox &&
            Math.abs(drawingBox.width) > 12 &&
            Math.abs(drawingBox.height) > 12
        ) {
            setAnnotations([
                ...annotations,
                {
                    ...drawingBox,
                    width: Math.abs(drawingBox.width),
                    height: Math.abs(drawingBox.height),
                    tag: currentTag,
                },
            ]);
        }
        setDrawingBox(null);
    };

    // Delete annotation
    const handleDelete = (idx) => {
        setAnnotations(annotations.filter((_, i) => i !== idx));
        setSelectedId(null);
    };

    // File upload & convert
    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (file) setImgUrl(URL.createObjectURL(file));
        setAnnotations([]);
        setLlmAnnotations([]);
    };

    // Predict
    const handlePredict = async () => {
        if (!imgUrl) return;
        // Get original file blob
        const blob = await fetch(imgUrl).then((r) => r.blob());
        const form = new FormData();
        form.append("file", blob, "image.png");
        // Update to your backend endpoint:
        const res = await fetch("http://localhost:8000/predict", {
            method: "POST",
            body: form,
        });
        if (!res.ok) {
            alert("Prediction failed.");
            return;
        }
        const pred = await res.json();
        setLlmAnnotations(pred);
    };

    // Save annotation as JSON
    const handleSave = () => {
        const json = JSON.stringify(
            annotations.map((a) => ({
                box: [
                    Math.round(a.x),
                    Math.round(a.y),
                    Math.round(a.width),
                    Math.round(a.height),
                ],
                tag: a.tag,
            })),
            null,
            2
        );
        const blob = new Blob([json], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "annotations.json";
        link.click();
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
                UI Tagging Tool
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Button component="label" variant="outlined">
                    Upload Image
                    <input hidden type="file" accept="image/*" onChange={handleUpload} />
                </Button>
                <Typography>Tag for new box: </Typography>
                <Select
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    size="small"
                >
                    {TAGS.map((t) => (
                        <MenuItem key={t} value={t}>
                            {t}
                        </MenuItem>
                    ))}
                </Select>
                <Button
                    variant="contained"
                    disabled={!imgUrl}
                    onClick={handlePredict}
                >
                    Predict
                </Button>
                <Button
                    variant="outlined"
                    disabled={!annotations.length}
                    onClick={handleSave}
                >
                    Save Annotations (JSON)
                </Button>
            </Stack>
            <Box
                border={1}
                borderColor="grey.400"
                sx={{
                    display: "inline-block",
                    position: "relative",
                    maxWidth: 900,
                    maxHeight: 600,
                }}
                mt={2}
            >
                {imgUrl && (
                    <Stage
                        width={Math.min(900, image?.width || 800)}
                        height={Math.min(600, image?.height || 600)}
                        ref={stageRef}
                        onMouseDown={handleMouseDown}
                        onMousemove={handleMouseMove}
                        onMouseup={handleMouseUp}
                    >
                        <Layer>
                            {image && (
                                <KonvaImage
                                    image={image}
                                    width={image.width}
                                    height={image.height}
                                />
                            )}
                            {/* User drawn boxes */}
                            {annotations.map((ann, i) => (
                                <AnnotationBox
                                    key={i}
                                    shapeProps={ann}
                                    isSelected={selectedId === i}
                                    onSelect={() => setSelectedId(i)}
                                    onChange={(newShape) =>
                                        setAnnotations(
                                            annotations.map((a, idx) =>
                                                idx === i ? { ...a, ...newShape } : a
                                            )
                                        )
                                    }
                                    index={i}
                                    onDelete={handleDelete}
                                    tag={ann.tag}
                                />
                            ))}
                            {/* LLM predictions */}
                            {llmAnnotations.map((ann, i) => (
                                <LLMBox key={i} box={ann.box} tag={ann.tag} />
                            ))}
                            {/* Drawing preview */}
                            {drawingBox && (
                                <AnnotationBox
                                    shapeProps={drawingBox}
                                    isSelected={false}
                                    tag={currentTag}
                                />
                            )}
                        </Layer>
                    </Stage>
                )}
            </Box>
            <Typography sx={{ mt: 2 }}>
                {annotations.length} annotation(s)
                {llmAnnotations.length ? (
                    <>; {llmAnnotations.length} LLM predictions</>
                ) : (
                    ""
                )}
            </Typography>
            <Typography fontSize={13} color="gray" sx={{ mt: 1 }}>
                Draw a box, assign tag, click [del] to remove. "Predict" for auto-tagging.
            </Typography>
        </Box>
    );
}

export default App;