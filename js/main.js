document.addEventListener("DOMContentLoaded", () => {
    new Interpreter(
        document.querySelector(".interpreter-console"),
        document.querySelector(".for-variables"),
        document.querySelector(".work-pos")
    );
});
