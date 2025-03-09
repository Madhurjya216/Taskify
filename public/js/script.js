function openModel() {
  document.querySelector("#pencil").addEventListener("click", function () {
    const form = document.querySelector(".uploadForm");
    if (form.style.display === "none") {
      form.style.display = "block";
    }
  });
}

function closeModel() {
  document.querySelector("#close").addEventListener("click", function () {
    document.querySelector(".uploadForm").style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // Delete functionality
  const deleteButtons = document.querySelectorAll(".delete-btn");
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation(); // Prevent event bubbling
      const postId = this.getAttribute("data-id");
      if (confirm("Are you sure you want to delete this post?")) {
        fetch(`/delete/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
          .then((response) => {
            if (response.ok) return response.json();
            throw new Error("Deletion failed");
          })
          .then(() => {
            this.closest(".note_box").remove();
          })
          .catch((err) => {
            console.error("Error deleting post:", err);
            alert("Error deleting post.");
          });
      }
    });
  });

  // Update functionality
  const updateButtons = document.querySelectorAll(".update-btn");
  const updateFormContainer = document.querySelector(".updateForm");
  const updateForm = document.getElementById("updateForm");
  const updateIdInput = document.getElementById("update_id");
  const updateTitleInput = document.getElementById("update_title");
  const updateMessageInput = document.getElementById("update_message");
  const updateClose = document.getElementById("update_close");

  // Handle clicking update button
  updateButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation(); // Prevent event bubbling
      const postId = this.getAttribute("data-id");
      const postTitle = this.getAttribute("data-title");
      const postMessage = this.getAttribute("data-message");

      // Populate the form
      updateIdInput.value = postId;
      updateTitleInput.value = postTitle;
      updateMessageInput.value = postMessage;

      // Show the form
      updateFormContainer.style.display = "block";
    });
  });

  // Handle closing update form
  updateClose.addEventListener("click", function () {
    updateFormContainer.style.display = "none";
  });

  // Handle update form submission
  updateForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const postId = updateIdInput.value;
    const updatedData = {
      title: updateTitleInput.value,
      message: updateMessageInput.value,
    };

    fetch(`/update/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Update failed with status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          // Update the DOM
          const noteBox = document
            .querySelector(`.update-btn[data-id="${postId}"]`)
            .closest(".note_box");
          noteBox.querySelector("h3").innerText = updatedData.title;
          noteBox.querySelector(".contain2 p").innerText = updatedData.message;

          // Update the data attributes
          const updateBtn = noteBox.querySelector(".update-btn");
          updateBtn.setAttribute("data-title", updatedData.title);
          updateBtn.setAttribute("data-message", updatedData.message);

          // Hide the form
          updateFormContainer.style.display = "none";
        }
      })
      .catch((err) => {
        console.error("Error updating post:", err);
        alert("Error updating post: " + err.message);
      });
  });

  // View functionality
  // View functionality
  const noteBoxes = document.querySelectorAll(".note_box");
  const viewModal = document.getElementById("viewModal");
  const viewTitle = document.getElementById("viewTitle");
  const viewMessage = document.getElementById("viewMessage");
  const closeView = document.getElementById("closeView");

  noteBoxes.forEach((box) => {
    box.addEventListener("click", function (e) {
      if (
        e.target.classList.contains("update-btn") ||
        e.target.classList.contains("delete-btn")
      ) {
        return;
      }
      // Get the post ID from the update button in this note box
      const updateBtn = this.querySelector(".update-btn");
      const postId = updateBtn.getAttribute("data-id");
      const title = this.querySelector("h3").innerText;
      const message = this.querySelector(".contain2 p").innerText;

      // Store all the data in the modal
      viewModal.setAttribute("data-id", postId);
      viewTitle.innerText = title;
      viewMessage.innerText = message;
      viewModal.style.display = "block";
    });
  });

  closeView.addEventListener("click", function () {
    viewModal.style.display = "none";
  });

  // View modal actions
  const modalUpdateBtn = document.getElementById("modalUpdateBtn");
  const modalDeleteBtn = document.getElementById("modalDeleteBtn");

  modalUpdateBtn.addEventListener("click", function () {
    const postId = viewModal.getAttribute("data-id");
    const postTitle = viewTitle.innerText;
    const postMessage = viewMessage.innerText;

    // Populate the update form with the current note data
    updateIdInput.value = postId;
    updateTitleInput.value = postTitle;
    updateMessageInput.value = postMessage;

    // Show update form and hide view modal
    updateFormContainer.style.display = "block";
    viewModal.style.display = "none";
  });

  modalDeleteBtn.addEventListener("click", function () {
    const postId = viewModal.getAttribute("data-id");

    if (confirm("Are you sure you want to delete this post?")) {
      fetch(`/delete/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => {
          if (response.ok) return response.json();
          throw new Error("Deletion failed");
        })
        .then(() => {
          // Find and remove the note box from the DOM
          const noteBox = document
            .querySelector(`.update-btn[data-id="${postId}"]`)
            .closest(".note_box");
          if (noteBox) {
            noteBox.remove();
          }
          viewModal.style.display = "none";
        })
        .catch((err) => {
          console.error("Error deleting post:", err);
          alert("Error deleting post.");
        });
    }
  });
});

openModel();
closeModel();
