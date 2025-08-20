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
  zoomReset.innerHTML = "100%";
  zoomReset.title = "Reset Zoom";

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

const resetZoom = () => {
  viewState.scale = 1;
  viewState.translation = complex(0, 0);
  updateTransform();
  updateZoomDisplay();
};

const updateZoomDisplay = () => {
  const zoomReset = preview.querySelector(".zoom-reset");
  if (zoomReset) {
    zoomReset.innerHTML = `${Math.round(viewState.scale * 100)}%`;
  }
};

const renderMermaid = async () => {
  const code = editor.value;
  if (!code) {
    preview.innerHTML = "";
    errorContainer.textContent = "";
    return;
  }

  try {
    // First, validate the syntax
    await mermaid.parse(code);

    // If valid, render it
    const { svg } = await mermaid.render("graphDiv", code);

    // Create container with zoom controls
    const {
      controls,
      zoomIn: zoomInBtn,
      zoomOut: zoomOutBtn,
      zoomReset: zoomResetBtn,
    } = createZoomControls();

    const container = document.createElement("div");
    container.className = "diagram-container";
    container.innerHTML = svg;

    preview.innerHTML = "";
    preview.appendChild(controls);
    preview.appendChild(container);

    // Add event listeners for zoom controls
    zoomInBtn.addEventListener("click", zoomIn);
    zoomOutBtn.addEventListener("click", zoomOut);
    zoomResetBtn.addEventListener("click", resetZoom);

    // Apply current transform
    updateTransform();
    updateZoomDisplay();

    // 如果是首次渲染（scale为1且translation为0），则自动居中显示
    if (
      viewState.scale === 1 &&
      viewState.translation.re === 0 &&
      viewState.translation.im === 0
    ) {
      resetZoom();
    }

    errorContainer.textContent = "";
  } catch (e) {
    errorContainer.textContent = e.str || e.message;
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

const savedContent = localStorage.getItem(STORAGE_KEY);
editor.value = savedContent || initialDiagram;
editor.addEventListener("input", renderMermaid);

window.addEventListener("beforeunload", saveContent);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    saveContent();
  }
});

// Initial render
renderMermaid();
