document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("upload-form");
  const resultDiv = document.getElementById("result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

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
                `;
      } else {
        resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
      }
    } catch (error) {
      console.error("Error:", error);
      resultDiv.innerHTML =
        "<p>An error occurred while processing the request.</p>";
    }
  });
});
