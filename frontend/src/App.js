import React, { useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import CircularProgress from "@mui/material/CircularProgress";
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

const MAX_WIDTH = 900;
const MAX_HEIGHT = 600;

function App() {
    const [imgUrl, setImgUrl] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [annotations, setAnnotations] = useState([]);
    const [llmAnnotations, setLlmAnnotations] = useState([]);
    const [drawingBox, setDrawingBox] = useState(null);
    const [currentTag, setCurrentTag] = useState(TAGS[0]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);

    const [image] = useImage(imgUrl);
    const stageRef = useRef();

    // -- SCALE LOGIC --
    let scale = 1;
    let stageWidth = MAX_WIDTH;
    let stageHeight = MAX_HEIGHT;
    if (image && image.width && image.height) {
        scale = Math.min(
            MAX_WIDTH / image.width,
            MAX_HEIGHT / image.height,
            1 // never upscale
        );
        stageWidth = Math.round(image.width * scale);
        stageHeight = Math.round(image.height * scale);
    }

    // Scale riêng từng trục để luôn khớp dù aspect ratio khác
    const scaleX = stageWidth / (image?.width || 1);
    const scaleY = stageHeight / (image?.height || 1);

    // LLMBox cũng scale y như image gốc
    const scaleLLMX = stageWidth / (image?.width || 1);
    const scaleLLMY = stageHeight / (image?.height || 1);

    // Draw box: mouse handlers
    const handleMouseDown = (e) => {
        if (!image) return;
        const { x, y } = e.target.getStage().getPointerPosition();
        setDrawingBox({ x: x / scaleX, y: y / scaleY, width: 0, height: 0 });
    };

    const handleMouseMove = (e) => {
        if (!drawingBox || !image) return;
        const { x, y } = e.target.getStage().getPointerPosition();
        setDrawingBox({
            ...drawingBox,
            width: x / scaleX - drawingBox.x,
            height: y / scaleY - drawingBox.y,
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
                    x: Math.min(drawingBox.x, drawingBox.x + drawingBox.width),
                    y: Math.min(drawingBox.y, drawingBox.y + drawingBox.height)
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
        if (file) {
            setImgUrl(URL.createObjectURL(file));
            setOriginalImage(file);
        }
        setAnnotations([]);
        setLlmAnnotations([]);
    };

    // Predict
    const handlePredict = async () => {
        if (!imgUrl) return;
        setLoading(true);
        try {
            const form = new FormData();
            form.append("file", originalImage, "image.png");
            form.append("imageWidth", image?.width);
            form.append("imageHeight", image?.height);
            const res = await fetch("http://localhost:8000/predict", {
                method: "POST",
                body: form,
            });
            if (!res.ok) {
                alert("Prediction failed.");
                return;
            }
            const pred = await res.json();

            const maxX = Math.max(...pred.map(a => a.box[0] + a.box[2]));
            const maxY = Math.max(...pred.map(a => a.box[1] + a.box[3]));

            const minX= Math.min(...pred.map(a => a.box[0]));
            const minY = Math.min(...pred.map(a => a.box[1]));

            console.log('LLM max right/bottom:', maxX, maxY);
            console.log('LLM min left/top:', minX, minY);
            console.log('Image size:', image?.width, image?.height);
            console.log("stage size", stageWidth, stageHeight);
            console.log("scaleX, scaleY", scaleX, scaleY);

            setLlmAnnotations(pred);
        } finally {
            setLoading(false);
        }
    };

    // Save annotation as JSON (User Annotations)
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
        link.download = "user_annotations.json";
        link.click();
    };

    // Save LLM predictions as JSON
    const handleSaveLLM = () => {
        const json = JSON.stringify(
            llmAnnotations.map((a) => ({
                box: [
                    Math.round(a.box[0]),
                    Math.round(a.box[1]),
                    Math.round(a.box[2]),
                    Math.round(a.box[3])
                ],
                tag: a.tag,
            })),
            null,
            2
        );
        const blob = new Blob([json], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "llm_annotations.json";
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
                    disabled={!imgUrl || loading}
                    onClick={handlePredict}
                >
                    {loading ? <CircularProgress size={22} sx={{ color: "white" }} /> : "Predict"}
                </Button>
                <Button
                    variant="outlined"
                    disabled={!annotations.length}
                    onClick={handleSave}
                >
                    Export User Annotations (JSON)
                </Button>
                <Button
                    variant="outlined"
                    disabled={!llmAnnotations.length}
                    onClick={handleSaveLLM}
                >
                    Export Prediction Annotations (JSON)
                </Button>
            </Stack>
            <Box
                border={1}
                borderColor="grey.400"
                sx={{
                    display: "inline-block",
                    position: "relative",
                    maxWidth: MAX_WIDTH,
                    maxHeight: MAX_HEIGHT,
                }}
                mt={2}
            >
                {imgUrl && (
                    <Stage
                        width={stageWidth}
                        height={stageHeight}
                        ref={stageRef}
                        onMouseDown={handleMouseDown}
                        onMousemove={handleMouseMove}
                        onMouseup={handleMouseUp}
                        style={{ background: "#f9f9f9" }}
                    >
                        <Layer>
                            {image && (
                                <KonvaImage
                                    image={image}
                                    width={stageWidth}
                                    height={stageHeight}
                                />
                            )}
                            {/* User drawn boxes */}
                            {annotations.map((ann, i) => (
                                <AnnotationBox
                                    key={i}
                                    shapeProps={{
                                        ...ann,
                                        x: ann.x * scaleX,
                                        y: ann.y * scaleY,
                                        width: ann.width * scaleX,
                                        height: ann.height * scaleY,
                                    }}
                                    isSelected={selectedId === i}
                                    onSelect={() => setSelectedId(i)}
                                    onChange={(newShape) =>
                                        setAnnotations(
                                            annotations.map((a, idx) =>
                                                idx === i ? {
                                                    ...a,
                                                    ...{
                                                        x: newShape.x / scaleX,
                                                        y: newShape.y / scaleY,
                                                        width: newShape.width / scaleX,
                                                        height: newShape.height / scaleY,
                                                    }
                                                } : a
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
                                <LLMBox
                                    key={i}
                                    box={[
                                        ann.box[0] * scaleLLMX,
                                        ann.box[1] * scaleLLMY,
                                        ann.box[2] * scaleLLMX,
                                        ann.box[3] * scaleLLMY
                                    ]}
                                    tag={ann.tag}
                                />
                            ))}
                            {/* Drawing preview */}
                            {drawingBox && (
                                <AnnotationBox
                                    shapeProps={{
                                        ...drawingBox,
                                        x: drawingBox.x * scaleX,
                                        y: drawingBox.y * scaleY,
                                        width: drawingBox.width * scaleX,
                                        height: drawingBox.height * scaleY,
                                    }}
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