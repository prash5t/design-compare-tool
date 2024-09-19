document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("upload-form");
  const resultDiv = document.getElementById("result");
  const figmaDropArea = document.getElementById("figma-drop-area");
  const builtDropArea = document.getElementById("built-drop-area");
  const figmaInput = document.getElementById("figma-image");
  const builtInput = document.getElementById("built-image");
  const compareBtn = document.getElementById("compare-btn");

  // Generate a unique session ID
  const sessionId = generateSessionId();

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

    var formData = new FormData();

    // Add session ID to form data
    formData.append("session_id", sessionId);

    // Ensure files are added to FormData
    if (figmaInput.files.length > 0) {
      formData.append("figma_image", figmaInput.files[0]);
    }
    if (builtInput.files.length > 0) {
      formData.append("built_image", builtInput.files[0]);
    }

    // Log the form data
    for (var pair of formData.entries()) {
      console.log(pair[0] + ": " + pair[1]);
    }

    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        resultDiv.innerHTML = `
          <h2>Comparison Result</h2>
          <p class="similarity">Similarity: ${data.similarity}%</p>
          <p>${data.message}</p>
          <p><a href="/uploads/${data.comparison_image}" target="_blank">Click here to view the comparison image</a></p>
        `;
      })
      .catch((error) => {
        console.error("Error:", error);
        resultDiv.innerHTML = `<p>An error occurred: ${error.message}</p>`;
      });
  });
});

// Function to generate a unique session ID
function generateSessionId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
