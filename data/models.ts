export type RegistryModel = {
  id: string;
  name: string;
  type: "LoRA" | "Adapter" | "Small Specialized" | "Domain Expert";
  base: string;
  calls: string;
  price: string;
  trend: number[];
  curveMultiplier: string;
};

export const MODELS: readonly RegistryModel[] = [
  {
    id: "0x4a7f…b12c",
    name: "solidity-audit-v3",
    type: "Domain Expert",
    base: "Llama-3-8B",
    calls: "412k",
    price: "0.0021",
    trend: [6, 8, 7, 10, 12, 15, 18, 21, 24, 22, 26, 30],
    curveMultiplier: "4.2×",
  },
  {
    id: "0x1d90…e847",
    name: "medical-triage-lora",
    type: "LoRA",
    base: "Mistral-7B",
    calls: "288k",
    price: "0.0034",
    trend: [4, 5, 6, 6, 8, 9, 11, 12, 14, 17, 19, 22],
    curveMultiplier: "3.1×",
  },
  {
    id: "0xa210…0f6b",
    name: "browser-agent-adapter",
    type: "Adapter",
    base: "Qwen-2.5-7B",
    calls: "1.2M",
    price: "0.0009",
    trend: [3, 5, 7, 10, 14, 18, 22, 26, 30, 33, 38, 42],
    curveMultiplier: "8.7×",
  },
  {
    id: "0xc812…3d4e",
    name: "sql-writer-tiny",
    type: "Small Specialized",
    base: "Gemma-2B",
    calls: "96k",
    price: "0.0012",
    trend: [2, 3, 4, 5, 5, 6, 7, 9, 10, 12, 13, 15],
    curveMultiplier: "2.4×",
  },
];
