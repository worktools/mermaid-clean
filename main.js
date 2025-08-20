import "./style.css";
import mermaid from "mermaid";
import { complex, add, sub, mulReal, divReal } from "./src/complex.js";

const initialDiagram = `graph TD
    A[Start] --> B{Is it?};
    B -- Yes --> C[OK];
    C --> D[Rethink];
    D --> A;
    B -- No --> E[End];
`;

const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const errorContainer = document.getElementById("error-container");

// 视图变换状态管理
// 使用复数表示平移，实数表示缩放
// 坐标系统：屏幕坐标 = (图像坐标 * scale) + translation
let viewState = {
  translation: complex(0, 0), // 屏幕坐标系下的平移
  scale: 1, // 缩放比例
};

// 拖拽状态
let dragState = {
  isDragging: false,
  startMousePos: complex(0, 0),
  startTranslation: complex(0, 0),
};

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

// Create zoom controls
const createZoomControls = () => {
  const controls = document.createElement("div");
  controls.className = "zoom-controls";

  const zoomIn = document.createElement("button");
  zoomIn.className = "zoom-btn";
  zoomIn.innerHTML = "+";
  zoomIn.title = "Zoom In";

  const zoomOut = document.createElement("button");
  zoomOut.className = "zoom-btn";
  zoomOut.innerHTML = "−";
  zoomOut.title = "Zoom Out";

  const zoomReset = document.createElement("button");
  zoomReset.className = "zoom-btn zoom-reset";
  zoomReset.innerHTML = "Fit";
  zoomReset.title = "Fit to Screen";

  controls.appendChild(zoomIn);
  controls.appendChild(zoomOut);
  controls.appendChild(zoomReset);

  return { controls, zoomIn, zoomOut, zoomReset };
};

// 将屏幕坐标转换为图像坐标
const screenToImage = (screenPos) => {
  return divReal(sub(screenPos, viewState.translation), viewState.scale);
};

// 将图像坐标转换为屏幕坐标
const imageToScreen = (imagePos) => {
  return add(mulReal(imagePos, viewState.scale), viewState.translation);
};

// 更新变换
const updateTransform = () => {
  const container = preview.querySelector(".diagram-container");
  if (container) {
    const { re, im } = viewState.translation;
    container.style.transform = `translate(${re}px, ${im}px) scale(${viewState.scale})`;
  }
};

// 获取SVG图形的中心位置（屏幕坐标）
const getSVGCenter = () => {
  const container = preview.querySelector(".diagram-container");
  const svg = container?.querySelector("svg");

  if (!svg) {
    // 如果没有SVG，返回预览区域中心
    const rect = preview.getBoundingClientRect();
    return complex(rect.width / 2, rect.height / 2);
  }

  // 获取SVG的边界框
  const svgRect = svg.getBBox();
  const svgWidth = svgRect.width;
  const svgHeight = svgRect.height;

  // SVG中心在图像坐标系中的位置
  const svgImageCenter = complex(svgWidth / 2, svgHeight / 2);

  // 转换为屏幕坐标
  return imageToScreen(svgImageCenter);
};

// 缩放函数 - 以SVG中心为不动点进行缩放
const zoomAtSVGCenter = (factor) => {
  // 限制缩放范围
  const newScale = Math.max(0.1, Math.min(5, viewState.scale * factor));

  if (newScale === viewState.scale) return; // 缩放被限制时不做任何操作

  // 获取当前SVG中心的屏幕坐标
  const svgScreenCenter = getSVGCenter();

  // 找到SVG中心对应的图像坐标
  const svgImageCenter = screenToImage(svgScreenCenter);

  // 更新缩放比例
  viewState.scale = newScale;

  // 重新计算平移，使得SVG中心仍然在相同的屏幕位置
  viewState.translation = sub(
    svgScreenCenter,
    mulReal(svgImageCenter, viewState.scale)
  );

  updateTransform();
  updateZoomDisplay();
};

// 缩放按钮事件处理
const zoomIn = () => {
  zoomAtSVGCenter(1.2);
};

const zoomOut = () => {
  zoomAtSVGCenter(1 / 1.2);
};

const zoomToFit = () => {
  const container = preview.querySelector(".diagram-container");
  const svg = container?.querySelector("svg");
  if (!svg || !container) {
    // Fallback to a simple reset if something is wrong
    viewState.scale = 1;
    viewState.translation = complex(0, 0);
    updateTransform();
    updateZoomDisplay();
    return;
  }

  const previewRect = preview.getBoundingClientRect();
  const svgRect = svg.getBBox();

  if (svgRect.width === 0 || svgRect.height === 0) {
    // Fallback for empty diagram
    viewState.scale = 1;
    viewState.translation = complex(0, 0);
    updateTransform();
    updateZoomDisplay();
    return;
  }

  const availableWidth = previewRect.width * 0.8; // 10% margin on each side
  const availableHeight = previewRect.height * 0.8;

  const scaleX = availableWidth / svgRect.width;
  const scaleY = availableHeight / svgRect.height;

  viewState.scale = Math.min(scaleX, scaleY);

  // Center the diagram
  const scaledSvgWidth = svgRect.width * viewState.scale;
  const scaledSvgHeight = svgRect.height * viewState.scale;

  const transX =
    (previewRect.width - scaledSvgWidth) / 2 - svgRect.x * viewState.scale;
  const transY =
    (previewRect.height - scaledSvgHeight) / 2 - svgRect.y * viewState.scale;

  viewState.translation = complex(transX, transY);

  updateTransform();
  updateZoomDisplay();
};

const resetZoom = () => {
  zoomToFit();
};

const updateZoomDisplay = () => {
  const zoomReset = preview.querySelector(".zoom-reset");
  if (zoomReset) {
    zoomReset.innerHTML = `${Math.round(viewState.scale * 100)}%`;
  }
};

const renderMermaid = async () => {
  const code = editor.value;
  const container = preview.querySelector(".diagram-container");

  if (!container) return;

  const hasContent = container.querySelector("svg");

  // Fade out before rendering
  if (hasContent) {
    container.style.opacity = 0;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Disable transform transition for instant update
  container.style.transition = "opacity 0.15s ease-in-out";

  try {
    if (!code) {
      container.innerHTML = "";
      errorContainer.textContent = "";
      return; // Exit here, finally will still run
    }

    await mermaid.parse(code);
    const { svg } = await mermaid.render("graphDiv", code);
    container.innerHTML = svg;
    errorContainer.textContent = "";

    if (
      viewState.scale === 1 &&
      viewState.translation.re === 0 &&
      viewState.translation.im === 0
    ) {
      resetZoom();
    } else {
      updateTransform();
    }
    updateZoomDisplay();
  } catch (e) {
    errorContainer.textContent = e.str || e.message;
    container.innerHTML = "";
  } finally {
    // Fade in with new content (or empty)
    container.style.opacity = 1;

    // Restore transition for user interactions
    setTimeout(() => {
      if (container) {
        container.style.transition =
          "transform 0.1s ease-out, opacity 0.1s ease-in-out";
      }
    }, 100);
  }
};

// 鼠标拖拽事件处理
preview.addEventListener("mousedown", (e) => {
  if (e.target.closest(".zoom-controls")) return;

  dragState.isDragging = true;
  dragState.startMousePos = complex(e.clientX, e.clientY);
  dragState.startTranslation = complex(
    viewState.translation.re,
    viewState.translation.im
  );
  e.preventDefault();
});

preview.addEventListener("mousemove", (e) => {
  if (!dragState.isDragging) return;

  const currentMousePos = complex(e.clientX, e.clientY);
  const mouseDelta = sub(currentMousePos, dragState.startMousePos);

  // 直接将鼠标移动距离加到初始平移上
  viewState.translation = add(dragState.startTranslation, mouseDelta);

  updateTransform();
});

preview.addEventListener("mouseup", () => {
  dragState.isDragging = false;
});

preview.addEventListener("mouseleave", () => {
  dragState.isDragging = false;
});

// 鼠标滚轮缩放事件处理
preview.addEventListener("wheel", (e) => {
  e.preventDefault();

  // 根据滚轮方向确定缩放因子
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

  // 以SVG中心为不动点进行缩放
  zoomAtSVGCenter(zoomFactor);
});

const STORAGE_KEY = "mermaid-clean-storage";

const saveContent = () => {
  localStorage.setItem(STORAGE_KEY, editor.value);
};

// Create and append zoom controls and diagram container
const {
  controls,
  zoomIn: zoomInBtn,
  zoomOut: zoomOutBtn,
  zoomReset: zoomResetBtn,
} = createZoomControls();
preview.appendChild(controls);

const diagramContainer = document.createElement("div");
diagramContainer.className = "diagram-container";
preview.appendChild(diagramContainer);

// Add event listeners for zoom controls
zoomInBtn.addEventListener("click", zoomIn);
zoomOutBtn.addEventListener("click", zoomOut);
zoomResetBtn.addEventListener("click", resetZoom);

const savedContent = localStorage.getItem(STORAGE_KEY);
editor.value = savedContent || initialDiagram;
editor.addEventListener("input", renderMermaid);

window.addEventListener("beforeunload", saveContent);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    saveContent();
  }
});

window.addEventListener("resize", resetZoom);

// Initial render
renderMermaid();
