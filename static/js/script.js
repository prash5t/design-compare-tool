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

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var formData = new FormData(this);

    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        var resultDiv = document.getElementById("result");
        resultDiv.innerHTML = `
        <h2>Comparison Result</h2>
        <p>${data.message}</p>
        <img src="/uploads/${data.comparison_image}" alt="Comparison Image">
      `;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
});
