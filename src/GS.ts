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

function setLoadingBar(progress: number) {
  const bar = document.getElementById("loading-bar");
  if (bar != null) {
    bar.style.width = `${progress}%`;
  }
}

function completeLoadingBar() {
  const bar = document.getElementById("loading-bar");
  if (bar != null) {
    bar.style.backgroundColor = "#2196f3";
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

// Initialize an empty conversation array with the correct type
let conversation: ChatCompletionMessageParam[] = [];

async function main() {
  const initProgressCallback = (report: webllm.InitProgressReport) => {
    setLabel("init-label", report.text);

    // Extract the loading progress as current and total stages
    const match = report.text.match(/\[(\d+)\/(\d+)\]/);
    if (match) {
      const currentStage = parseInt(match[1], 10);
      const totalStages = parseInt(match[2], 10);
      const progress = Math.round((currentStage / totalStages) * 100);
      setLoadingBar(progress);
    }
  };

  const selectedModel = "Llama-3-8B-Instruct-q4f32_1";
  const engine: webllm.EngineInterface = await webllm.CreateEngine(
    selectedModel,
    { initProgressCallback: initProgressCallback }
  );

  completeLoadingBar(); // Turn the bar to blue when loading is complete

  async function generateResponse() {
    const userInput = (document.getElementById("user-input") as HTMLInputElement).value;

    if (userInput) {
      conversation.push({ role: "user", content: userInput });
      updateConversationUI(conversation, true); // Show typing indicator
      (document.getElementById("user-input") as HTMLInputElement).value = "";

      const response = await engine.chat.completions.create({
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
}

main();
