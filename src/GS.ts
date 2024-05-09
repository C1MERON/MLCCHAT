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
    throw Error("Cannot find label " + id);
  }
  label.innerText = text;
}

// Initialize an empty conversation array with the correct type
let conversation: ChatCompletionMessageParam[] = [];

async function main() {
  const initProgressCallback = (report: webllm.InitProgressReport) => {
    setLabel("init-label", report.text);
  };

  const selectedModel = "Llama-3-8B-Instruct-q4f32_1";
  const engine: webllm.EngineInterface = await webllm.CreateEngine(
    selectedModel,
    { initProgressCallback: initProgressCallback }
  );

  async function generateResponse() {
    const userInput = (document.getElementById("user-input") as HTMLInputElement).value;

    if (userInput) {
      conversation.push({ role: "user", content: userInput });

      const response = await engine.chat.completions.create({
        messages: conversation,
        n: 1,
        temperature: 1.5,
        max_gen_len: 256,
      });

      const choice = response.choices[0];
      conversation.push({ role: "assistant", content: choice.message?.content || "No response received." });

      setLabel("prompt-label", `Prompt: ${userInput}`);
      setLabel("generate-label", `Response: ${choice.message?.content || "No response received."}`);
      setLabel("stats-label", await engine.runtimeStatsText());
      (document.getElementById("user-input") as HTMLInputElement).value = "";
    } else {
      alert("Please enter a prompt!");
    }
  }

  function restartConversation() {
    conversation = [];
    setLabel("prompt-label", "");
    setLabel("generate-label", "");
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
