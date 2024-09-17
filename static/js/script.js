document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("upload-form");
  const resultDiv = document.getElementById("result");
  const figmaDropArea = document.getElementById("figma-drop-area");
  const builtDropArea = document.getElementById("built-drop-area");
  const figmaInput = document.getElementById("figma-image");
  const builtInput = document.getElementById("built-image");
  const compareBtn = document.getElementById("compare-btn");

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add("dragover");
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove("dragover");
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove("dragover");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const input = this.querySelector('input[type="file"]');
      input.files = files;
      displayImage(this, file);
      checkInputs();
    }
  }

  function handleClick() {
    this.querySelector('input[type="file"]').click();
  }

  function displayImage(dropArea, file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.classList.add("preview-image");
      dropArea.innerHTML = "";
      dropArea.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  function checkInputs() {
    if (figmaInput.files.length > 0 && builtInput.files.length > 0) {
      compareBtn.disabled = false;
    } else {
      compareBtn.disabled = true;
    }
  }

  [figmaDropArea, builtDropArea].forEach((dropArea) => {
    dropArea.addEventListener("dragover", handleDragOver);
    dropArea.addEventListener("dragleave", handleDragLeave);
    dropArea.addEventListener("drop", handleDrop);
    dropArea.addEventListener("click", handleClick);
  });

  [figmaInput, builtInput].forEach((input) => {
    input.addEventListener("change", function (e) {
      if (this.files.length > 0) {
        displayImage(this.parentElement, this.files[0]);
        checkInputs();
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData();

    // Manually append files to FormData
    if (figmaInput.files.length > 0) {
      formData.append("figma_image", figmaInput.files[0]);
    }
    if (builtInput.files.length > 0) {
      formData.append("built_image", builtInput.files[0]);
    }

    // Log the FormData contents
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        resultDiv.innerHTML = `
          <h2>Comparison Result</h2>
          <p>${data.message}</p>
          <img src="/uploads/${data.comparison_image}" alt="Comparison Result">
        `;
      } else {
        resultDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
      }
    } catch (error) {
      console.error("Error:", error);
      resultDiv.innerHTML = `<p class="error">An error occurred while processing the request: ${error.message}</p>`;
    }
  });
});
