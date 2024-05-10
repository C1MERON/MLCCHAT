// @ts-ignore
import * as webllm from "@mlc-ai/web-llm";

// Define the correct message type
interface ChatCompletionMessageParam {
  role: "user" | "assistant";
  content: string;
}

function setLabel(id: string, text: string) {
  const label = document.getElementById(id);
  if (label == null) {
    console.error(`Cannot find label ${id}`);
    return;
  }
  label.innerText = text;
}

function setCircularProgress(progress: number) {
  const circle = document.getElementById("loading-path") as SVGPathElement;
  const text = document.getElementById("loading-text");
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;

  if (circle != null) {
    const offset = circumference - (progress / 100) * circumference;
    circle.style.strokeDasharray = `${circumference}, ${circumference}`;
    circle.style.strokeDashoffset = `${offset}`;
  }

  if (text != null) {
    text.innerText = `${progress}%`;
  }
}

function completeCircularProgress() {
  const circle = document.getElementById("loading-path") as SVGPathElement;
  if (circle != null) {
    circle.style.stroke = "#2196f3";
  }
}

function scrollConversationToBottom() {
  const conversationWrapper = document.getElementById("conversation-wrapper");
  if (conversationWrapper != null) {
    conversationWrapper.scrollTop = conversationWrapper.scrollHeight;
  }
}

function updateConversationUI(conversation: ChatCompletionMessageParam[], isTyping: boolean = false) {
  const conversationWrapper = document.getElementById("conversation-wrapper");
  if (conversationWrapper != null) {
    conversationWrapper.innerHTML = conversation
      .map((message) => {
        const messageClass = message.role === "user" ? "message-user" : "message-assistant";
        return `<div class="message ${messageClass}">${message.content}</div>`;
      })
      .join("");
    if (isTyping) {
      conversationWrapper.innerHTML += `<div class="typing-indicator">LLM is typing...</div>`;
    }
    scrollConversationToBottom();
  }
}

// Initialize conversation and other variables
let conversation: ChatCompletionMessageParam[] = [];
let engine: webllm.EngineInterface | null = null;
let selectedModel = "Llama-3-8B-Instruct-q4f32_1";

async function loadModel(modelName: string) {
  const initProgressCallback = (report: webllm.InitProgressReport) => {
    setLabel("init-label", report.text);

    // Extract the loading progress as current and total stages
    const match = report.text.match(/\[(\d+)\/(\d+)\]/);
    if (match) {
      const currentStage = parseInt(match[1], 10);
      const totalStages = parseInt(match[2], 10);
      const progress = Math.round((currentStage / totalStages) * 100);
      setCircularProgress(progress);
    }
  };

  engine = await webllm.CreateEngine(modelName, { initProgressCallback: initProgressCallback });
  completeCircularProgress(); // Turn the circle to blue when loading is complete
  setLabel("stats-label", await engine.runtimeStatsText());
}

async function generateResponse() {
  const userInput = (document.getElementById("user-input") as HTMLInputElement).value;

  if (userInput) {
    if (!engine) {
      console.log(`Loading default model: ${selectedModel}`);
      await loadModel(selectedModel);
    }

    conversation.push({ role: "user", content: userInput });
    updateConversationUI(conversation, true); // Show typing indicator
    (document.getElementById("user-input") as HTMLInputElement).value = "";

    const response = await engine!.chat.completions.create({
      messages: conversation,
      n: 1,
      temperature: 1.5,
      max_gen_len: 256,
    });

    const choice = response.choices[0];
    conversation.push({ role: "assistant", content: choice.message?.content || "No response received." });

    updateConversationUI(conversation);
    setLabel("stats-label", await engine.runtimeStatsText());
  } else {
    alert("Please enter a prompt!");
  }
}

function restartConversation() {
  conversation = [];
  updateConversationUI(conversation);
  setLabel("stats-label", "");
  (document.getElementById("user-input") as HTMLInputElement).value = "";
}

// Attach event listeners
function main() {
  const sendBtn = document.getElementById("send-btn");
  if (sendBtn != null) {
    console.log("Send button found, attaching event listener.");
    sendBtn.addEventListener("click", () => {
      console.log("Send button clicked.");
      generateResponse();
    });
  } else {
    console.error("Send button not found.");
  }

  const restartBtn = document.getElementById("restart-btn");
  if (restartBtn != null) {
    console.log("Restart button found, attaching event listener.");
    restartBtn.addEventListener("click", () => {
      console.log("Restart button clicked.");
      restartConversation();
    });
  } else {
    console.error("Restart button not found.");
  }

  const modelSelect = document.getElementById("chatui-select") as HTMLSelectElement;
  if (modelSelect != null) {
    console.log("Model select found, attaching event listener.");
    modelSelect.addEventListener("change", async () => {
      selectedModel = modelSelect.value;
      console.log(`Selected model: ${selectedModel}`);
      restartConversation();
      engine = null; // Reset engine to trigger loading on next Send button click
    });
  } else {
    console.error("Model select not found.");
  }
}

main();
