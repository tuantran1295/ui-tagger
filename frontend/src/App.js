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

    // --- Debug logs ---
    // console.log("SCALE:", scale);
    // console.log(
    //     "User box:",
    //     annotations[0]?.x,
    //     annotations[0]?.y,
    //     annotations[0]?.width,
    //     annotations[0]?.height
    // );
    // console.log("LLM box raw:", llmAnnotations[0]?.box);
    // console.log(
    //     "LLM box scaled:",
    //     llmAnnotations[0]?.box?.map(v => v * scale)
    // );

    console.log("original image size", image?.width, image?.height);
    console.log("stage size", stageWidth, stageHeight);
    console.log("scale", scale);
    console.log("llm box raw", llmAnnotations[0]?.box); // e.g. [x, y, w, h]

    // Draw box: mouse handlers
    const handleMouseDown = (e) => {
        if (!image) return;
        const { x, y } = e.target.getStage().getPointerPosition();
        // Convert to image coordinates (unscaling)
        setDrawingBox({ x: x / scale, y: y / scale, width: 0, height: 0 });
    };

    const handleMouseMove = (e) => {
        if (!drawingBox || !image) return;
        const { x, y } = e.target.getStage().getPointerPosition();
        setDrawingBox({
            ...drawingBox,
            width: x / scale - drawingBox.x,
            height: y / scale - drawingBox.y,
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
            // const blob = await fetch(imgUrl).then((r) => r.blob());
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
            setLlmAnnotations(pred);
        }  finally {
            setLoading(false);
        }

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
                    Save Annotations (JSON)
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
                                    width={image.width * scale}
                                    height={image.height * scale}
                                />
                            )}
                            {/* User drawn boxes */}
                            {annotations.map((ann, i) => (
                                <AnnotationBox
                                    key={i}
                                    shapeProps={{
                                        ...ann,
                                        x: ann.x * scale,
                                        y: ann.y * scale,
                                        width: ann.width * scale,
                                        height: ann.height * scale,
                                    }}
                                    isSelected={selectedId === i}
                                    onSelect={() => setSelectedId(i)}
                                    onChange={(newShape) =>
                                        setAnnotations(
                                            annotations.map((a, idx) =>
                                                idx === i ? {
                                                    ...a,
                                                    ...{
                                                        x: newShape.x / scale,
                                                        y: newShape.y / scale,
                                                        width: newShape.width / scale,
                                                        height: newShape.height / scale,
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
                                    // box={ann.box}
                                    box={[
                                        ann.box[0] * scale,
                                        ann.box[1] * scale,
                                        ann.box[2] * scale,
                                        ann.box[3] * scale
                                    ]}
                                    tag={ann.tag}
                                />
                            ))}
                            {/* Drawing preview */}
                            {drawingBox && (
                                <AnnotationBox
                                    shapeProps={{
                                        ...drawingBox,
                                        x: drawingBox.x * scale,
                                        y: drawingBox.y * scale,
                                        width: drawingBox.width * scale,
                                        height: drawingBox.height * scale,
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