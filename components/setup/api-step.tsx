import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FC } from "react"
import { Button } from "../ui/button"

interface APIStepProps {
  openaiAPIKey: string
  openaiOrgID: string
  anthropicAPIKey: string
  googleGeminiAPIKey: string
  mistralAPIKey: string
  groqAPIKey: string
  perplexityAPIKey: string
  openrouterAPIKey: string
  onOpenaiAPIKeyChange: (value: string) => void
  onOpenaiOrgIDChange: (value: string) => void
  onAnthropicAPIKeyChange: (value: string) => void
  onGoogleGeminiAPIKeyChange: (value: string) => void
  onMistralAPIKeyChange: (value: string) => void
  onGroqAPIKeyChange: (value: string) => void
  onPerplexityAPIKeyChange: (value: string) => void
  onOpenrouterAPIKeyChange: (value: string) => void
}

export const APIStep: FC<APIStepProps> = ({
  openaiAPIKey,
  openaiOrgID,
  anthropicAPIKey,
  googleGeminiAPIKey,
  mistralAPIKey,
  groqAPIKey,
  perplexityAPIKey,
  openrouterAPIKey,
  onOpenaiAPIKeyChange,
  onOpenaiOrgIDChange,
  onAnthropicAPIKeyChange,
  onGoogleGeminiAPIKeyChange,
  onMistralAPIKeyChange,
  onGroqAPIKeyChange,
  onPerplexityAPIKeyChange,
  onOpenrouterAPIKeyChange
}) => {
  return (
    <>
      <div className="mt-5 space-y-2">
        <Label>OpenAI API Key</Label>
        <Input
          placeholder="OpenAI API Key"
          type="password"
          value={openaiAPIKey}
          onChange={e => onOpenaiAPIKeyChange(e.target.value)}
        />
      </div>

      <div className="ml-8 space-y-3">
        <div className="space-y-1">
          <Label>OpenAI Organization ID</Label>
          <Input
            placeholder="OpenAI Organization ID (optional)"
            type="password"
            value={openaiOrgID}
            onChange={e => onOpenaiOrgIDChange(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Label>Anthropic API Key</Label>
        <Input
          placeholder="Anthropic API Key"
          type="password"
          value={anthropicAPIKey}
          onChange={e => onAnthropicAPIKeyChange(e.target.value)}
        />
      </div>

      <div className="mt-5 space-y-2">
        <Label>Google Gemini API Key</Label>
        <Input
          placeholder="Google Gemini API Key"
          type="password"
          value={googleGeminiAPIKey}
          onChange={e => onGoogleGeminiAPIKeyChange(e.target.value)}
        />
      </div>

      <div className="mt-5 space-y-2">
        <Label>Mistral API Key</Label>
        <Input
          placeholder="Mistral API Key"
          type="password"
          value={mistralAPIKey}
          onChange={e => onMistralAPIKeyChange(e.target.value)}
        />
      </div>

      <div className="mt-5 space-y-2">
        <Label>Groq API Key</Label>
        <Input
          placeholder="Groq API Key"
          type="password"
          value={groqAPIKey}
          onChange={e => onGroqAPIKeyChange(e.target.value)}
        />
      </div>

      <div className="mt-5 space-y-2">
        <Label>Perplexity API Key</Label>
        <Input
          placeholder="Perplexity API Key"
          type="password"
          value={perplexityAPIKey}
          onChange={e => onPerplexityAPIKeyChange(e.target.value)}
        />
      </div>

      <div className="mt-5 space-y-2">
        <Label>OpenRouter API Key</Label>
        <Input
          placeholder="OpenRouter API Key"
          type="password"
          value={openrouterAPIKey}
          onChange={e => onOpenrouterAPIKeyChange(e.target.value)}
        />
      </div>
    </>
  )
}
