const messageInput = document.getElementById("messageInput");
const output = document.getElementById("output");
const codeTable = document.getElementById("codeTable");

const originalSize = document.getElementById("originalSize");
const compressedSize = document.getElementById("compressedSize");
const compressionRatio = document.getElementById("compressionRatio");
const spaceSaved = document.getElementById("spaceSaved");

const copyBtn = document.getElementById("copyBtn");
const pasteBtn = document.getElementById("pasteBtn");
const clearBtn = document.getElementById("clearBtn");
const encryptBtn = document.getElementById("encryptBtn");
const decryptBtn = document.getElementById("decryptBtn");

let huffmanRoot = null;

class HuffmanNode {
  constructor(character, frequency) {
    this.character = character;
    this.frequency = frequency;
    this.left = null;
    this.right = null;
  }
}

class MinHeap {
  constructor() {
    this.heap = [];
  }

  insert(node) {
    this.heap.push(node);

    let index = this.heap.length - 1;

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);

      if (this.heap[parentIndex].frequency <= this.heap[index].frequency) {
        break;
      }

      [this.heap[parentIndex], this.heap[index]] = [
        this.heap[index],
        this.heap[parentIndex],
      ];

      index = parentIndex;
    }
  }

  extractMin() {
    if (this.heap.length === 0) {
      return null;
    }

    if (this.heap.length === 1) {
      return this.heap.pop();
    }

    const min = this.heap[0];

    this.heap[0] = this.heap.pop();

    let index = 0;

    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      let smallest = index;

      if (
        leftChild < this.heap.length &&
        this.heap[leftChild].frequency < this.heap[smallest].frequency
      ) {
        smallest = leftChild;
      }

      if (
        rightChild < this.heap.length &&
        this.heap[rightChild].frequency < this.heap[smallest].frequency
      ) {
        smallest = rightChild;
      }

      if (smallest === index) {
        break;
      }

      [this.heap[index], this.heap[smallest]] = [
        this.heap[smallest],
        this.heap[index],
      ];

      index = smallest;
    }

    return min;
  }

  size() {
    return this.heap.length;
  }
}

function calculateFrequency(message) {
  const frequency = {};

  for (const character of message) {
    if (frequency[character]) {
      frequency[character]++;
    } else {
      frequency[character] = 1;
    }
  }

  return frequency;
}

function buildHuffmanTree(frequency) {
  const minHeap = new MinHeap();

  // Create a Huffman node for every character
  for (const character in frequency) {
    const node = new HuffmanNode(character, frequency[character]);

    minHeap.insert(node);
  }

  // Keep combining the two smallest nodes
  while (minHeap.size() > 1) {
    const left = minHeap.extractMin();
    const right = minHeap.extractMin();

    const mergedNode = new HuffmanNode(null, left.frequency + right.frequency);

    mergedNode.left = left;
    mergedNode.right = right;

    minHeap.insert(mergedNode);
  }

  // The remaining node is the root
  return minHeap.extractMin();
}

function generateCodes(root) {
  const codes = {};

  // Special case: only one unique character
  if (root.left === null && root.right === null) {
    codes[root.character] = "0";
    return codes;
  }

  function traverse(node, code) {
    // If this is a leaf node
    if (node.character !== null) {
      codes[node.character] = code;
      return;
    }

    // Go left → add 0
    if (node.left !== null) {
      traverse(node.left, code + "0");
    }

    // Go right → add 1
    if (node.right !== null) {
      traverse(node.right, code + "1");
    }
  }

  traverse(root, "");

  return codes;
}

function displayCodeTable(frequency, codes) {
  codeTable.innerHTML = "";

  for (const character in codes) {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td class="py-3 px-4">${character}</td>
            <td class="py-3 px-4">${frequency[character]}</td>
            <td class="py-3 px-4 font-mono">${codes[character]}</td>
        `;

    codeTable.appendChild(row);
  }
}

function encodeMessage(message, codes) {
  let encodedMessage = "";

  for (const character of message) {
    encodedMessage += codes[character];
  }

  return encodedMessage;
}

function decodeMessage(encodedMessage, root) {

    // Special case: only one unique character
    if (root.left === null && root.right === null) {
        return root.character.repeat(encodedMessage.length);
    }

    let decodedMessage = "";
    let currentNode = root;

    for (const bit of encodedMessage) {

        if (bit === "0") {
            currentNode = currentNode.left;
        } else {
            currentNode = currentNode.right;
        }

        // Invalid path
        if (currentNode === null) {
            return null;
        }

        // We reached a leaf node
        if (currentNode.character !== null) {

            decodedMessage += currentNode.character;

            currentNode = root;
        }
    }

    // Bits ended before reaching the root
    if (currentNode !== root) {
        return null;
    }

    return decodedMessage;
}

encryptBtn.addEventListener("click", function () {
  const message = messageInput.value;

  if (message.length === 0) {
    output.value = "Please enter a message.";
    return;
  }

  const frequency = calculateFrequency(message);

  huffmanRoot = buildHuffmanTree(frequency);

  const codes = generateCodes(huffmanRoot);

  displayCodeTable(frequency, codes);

  const encodedMessage = encodeMessage(message, codes);
  const originalBits = message.length * 8;
  const compressedBits = encodedMessage.length;

  const ratio = (compressedBits / originalBits) * 100;
  const saved = 100 - ratio;

  originalSize.textContent = `${originalBits} bits`;
  compressedSize.textContent = `${compressedBits} bits`;
  compressionRatio.textContent = `${ratio.toFixed(2)}%`;
  spaceSaved.textContent = `${saved.toFixed(2)}%`;

  console.log("Frequency:", frequency);
  console.log("Huffman Tree:", huffmanRoot);
  console.log("Huffman Codes:", codes);
  console.log("Encoded Message:", encodedMessage);

  output.value = encodedMessage;
});

decryptBtn.addEventListener("click", function () {
  const encodedMessage = messageInput.value;

  if (encodedMessage.length === 0) {
    output.value = "Please enter an encoded message.";
    return;
  }

  if (!/^[01]+$/.test(encodedMessage)) {
    output.value = "Encoded message must contain only 0 and 1.";
    return;
  }

  if (huffmanRoot === null) {
    output.value = "Please encrypt a message first.";
    return;
  }

  const decodedMessage = decodeMessage(
    encodedMessage,
    huffmanRoot
);

if (decodedMessage === null) {
    output.value = "Invalid or incomplete Huffman encoded message.";
    return;
}

output.value = decodedMessage;
});

copyBtn.addEventListener("click", function () {
  navigator.clipboard.writeText(output.value);

  copyBtn.textContent = "Copied!";

  setTimeout(function () {
    copyBtn.textContent = "Copy";
  }, 1000);
});

pasteBtn.addEventListener("click", async function () {
  try {
    const clipboardText = await navigator.clipboard.readText();

    messageInput.value = clipboardText;

    pasteBtn.textContent = "Pasted!";

    setTimeout(function () {
      pasteBtn.textContent = "Paste";
    }, 1000);
  } catch (error) {
    pasteBtn.textContent = "Failed";

    setTimeout(function () {
      pasteBtn.textContent = "Paste";
    }, 1000);
  }
});

clearBtn.addEventListener("click", function () {

    messageInput.value = "";
    output.value = "";

    codeTable.innerHTML = "";

    originalSize.textContent = "0 bits";
    compressedSize.textContent = "0 bits";
    compressionRatio.textContent = "0%";
    spaceSaved.textContent = "0%";

});
