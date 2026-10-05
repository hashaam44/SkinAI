const dropZone = document.getElementById("dropZone");
const imageInput = document.getElementById("imageInput");
const dropContent = document.getElementById("dropContent");
const previewContainer = document.getElementById("previewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeImage = document.getElementById("removeImage");
const analyzeButton = document.getElementById("analyzeButton");

const resultPlaceholder = document.getElementById("resultPlaceholder");
const resultContent = document.getElementById("resultContent");

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


dropZone.addEventListener("click", (event) => {

    if (event.target === removeImage) {
        return;
    }

    imageInput.click();
});


imageInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (file) {
        handleFile(file);
    }
});


dropZone.addEventListener("dragover", (event) => {

    event.preventDefault();

    dropZone.classList.add("dragover");
});


dropZone.addEventListener("dragleave", () => {

    dropZone.classList.remove("dragover");
});


dropZone.addEventListener("drop", (event) => {

    event.preventDefault();

    dropZone.classList.remove("dragover");

    const file = event.dataTransfer.files[0];

    if (file) {
        handleFile(file);
    }
});


function handleFile(file) {

    if (!allowedTypes.includes(file.type)) {

        alert("Please select a JPG, PNG, or WEBP image.");

        resetImage();

        return;
    }


    if (file.size > MAX_FILE_SIZE) {

        alert("Image size must be less than 5 MB.");

        resetImage();

        return;
    }


    const reader = new FileReader();


    reader.onload = (event) => {

        imagePreview.src = event.target.result;

        dropContent.hidden = true;
        previewContainer.hidden = false;

        analyzeButton.disabled = false;

        resultPlaceholder.hidden = false;
        resultContent.hidden = true;
    };


    reader.readAsDataURL(file);
}


removeImage.addEventListener("click", (event) => {

    event.stopPropagation();

    resetImage();
});


function resetImage() {

    imageInput.value = "";

    imagePreview.src = "";

    dropContent.hidden = false;
    previewContainer.hidden = true;

    analyzeButton.disabled = true;

    resultPlaceholder.hidden = false;
    resultContent.hidden = true;
}


analyzeButton.addEventListener("click", async () => {

    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    const predictionClass =
        document.getElementById("predictionClass");

    const confidenceValue =
        document.getElementById("confidenceValue");

    const confidenceProgress =
        document.getElementById("confidenceProgress");

    const predictionStatus =
        document.getElementById("predictionStatus");

    const topPredictions =
        document.getElementById("topPredictions");

    const topPredictionsList =
        document.getElementById("topPredictionsList");

    resultPlaceholder.hidden = true;
    resultContent.hidden = false;

    predictionClass.textContent = "Analyzing...";
    confidenceValue.textContent = "—";
    confidenceProgress.style.width = "0%";
    predictionStatus.textContent =
        "SkinAI is analyzing the image...";

    topPredictions.hidden = true;
    topPredictionsList.innerHTML = "";

    analyzeButton.disabled = true;
    analyzeButton.classList.add("loading");

    const originalButtonText =
        analyzeButton.innerHTML;

    analyzeButton.innerHTML = `
        <span class="loading-spinner"></span>
        Analyzing...
    `;

    const formData = new FormData();

    formData.append("file", file);

    try {

        const response = await fetch(
            "/predict",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Prediction failed."
            );
        }

        const confidence =
            data.confidence_percent;

        predictionClass.textContent =
            data.prediction.toUpperCase();

        confidenceValue.textContent =
            `${confidence}%`;

        confidenceProgress.style.width =
            `${confidence}%`;

        if (data.accepted) {

            predictionStatus.textContent =
                `Prediction accepted at ${data.threshold * 100}% confidence threshold.`;

        } else {

            predictionStatus.textContent =
                `Prediction uncertain — confidence is below ${data.threshold * 100}%.`;

        }

        topPredictionsList.innerHTML = "";

        data.top_predictions.forEach(
            (prediction, index) => {

                const item =
                    document.createElement("div");

                item.className =
                    "top-prediction-item";

                item.innerHTML = `
                    <span class="top-prediction-rank">
                        #${index + 1}
                    </span>

                    <span class="top-prediction-class">
                        ${prediction.class.toUpperCase()}
                    </span>

                    <span class="top-prediction-confidence">
                        ${prediction.confidence}%
                    </span>
                `;

                topPredictionsList.appendChild(item);
            }
        );

        topPredictions.hidden = false;

    } catch (error) {

        predictionClass.textContent =
            "Analysis Failed";

        confidenceValue.textContent =
            "—";

        confidenceProgress.style.width =
            "0%";

        predictionStatus.textContent =
            error.message;

        topPredictions.hidden = true;

    } finally {

        analyzeButton.disabled = false;
        analyzeButton.classList.remove("loading");
        analyzeButton.innerHTML = originalButtonText;

    }
});
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

const savedTheme = localStorage.getItem("skinai-theme");

if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    themeIcon.textContent = "☾";
}


themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    const isLight =
        document.body.classList.contains("light-mode");

    if (isLight) {
        themeIcon.textContent = "☾";
        localStorage.setItem("skinai-theme", "light");
    } else {
        themeIcon.textContent = "☀";
        localStorage.setItem("skinai-theme", "dark");
    }

});

const menuToggle = document.getElementById("menuToggle");
const mobileSidebar = document.getElementById("mobileSidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarLinks = document.querySelectorAll(".sidebar-links a");


function openSidebar() {
    mobileSidebar.classList.add("active");
    sidebarOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
}


function closeSidebar() {
    mobileSidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
    document.body.style.overflow = "";
}


menuToggle.addEventListener("click", openSidebar);

sidebarClose.addEventListener("click", closeSidebar);

sidebarOverlay.addEventListener("click", closeSidebar);


sidebarLinks.forEach((link) => {

    link.addEventListener("click", closeSidebar);

});