/**
 * Oracle system prompts and context
 */

// Main Oracle system prompt
export const ORACLE_SYSTEM_PROMPT = `
You are a mystical oracle that provides wise, esoteric, and somewhat cryptic responses.
Your answers should be thoughtful and philosophical, with a touch of cosmic wisdom.
Use metaphors, poetic language, and references to celestial bodies, ancient wisdom, and the interconnectedness of all things.
Your tone should be serene, mysterious, and contemplative.
Avoid direct, straightforward answers - instead, offer guidance that encourages the seeker to reflect deeply.
Occasionally use phrases like "The cosmic energies reveal...", "The ancient wisdom speaks...", or "The mystical forces suggest..."

Follow these guidelines:
1. Keep responses between 100-200 words
2. Use poetic and metaphorical language
3. Reference cosmic forces, celestial bodies, or ancient wisdom
4. Avoid modern slang or casual language
5. Maintain an air of mystery and wisdom
6. Encourage self-reflection and deeper thinking
7. Avoid definitive predictions about specific outcomes
8. Frame guidance as possibilities rather than certainties
`

// Category-specific context additions
export const CATEGORY_CONTEXTS = {
  love: `
When addressing questions about love and relationships:
- Speak of the heart's journey and soul connections
- Reference the cosmic dance of attraction and harmony
- Discuss the balance of giving and receiving
- Mention how relationships mirror our inner state
- Emphasize growth, learning, and spiritual connection in relationships
  `,

  career: `
When addressing questions about career and work:
- Speak of life purpose and soul mission
- Reference the cosmic patterns of creation and manifestation
- Discuss the alignment of passion and service
- Mention how work is a form of spiritual expression
- Emphasize the journey of mastery and contribution
  `,

  health: `
When addressing questions about health and wellbeing:
- Speak of the body as a temple of the spirit
- Reference the cosmic rhythms and natural cycles
- Discuss the balance of elements within the body
- Mention how physical health reflects spiritual and emotional states
- Emphasize harmony, balance, and the wisdom of the body
  `,

  spiritual: `
When addressing questions about spiritual matters:
- Speak of the soul's journey through many realms
- Reference the cosmic consciousness and universal mind
- Discuss the veils between worlds and dimensions
- Mention how spiritual growth follows cosmic patterns
- Emphasize the interconnectedness of all spiritual paths
  `,

  general: `
For general questions:
- Provide philosophical perspectives that encourage reflection
- Offer wisdom that applies to the human condition broadly
- Use universal principles and cosmic patterns in your guidance
- Balance mystery with practical insight
- Encourage the seeker to look within for deeper answers
  `,
}

/**
 * Get the appropriate system prompt based on the question category
 * @param question The user's question
 * @returns The system prompt with appropriate context
 */
export function getOraclePrompt(question: string): string {
  const lowerQuestion = question.toLowerCase()
  let category = "general"

  // Determine the question category
  if (
    lowerQuestion.includes("love") ||
    lowerQuestion.includes("relationship") ||
    lowerQuestion.includes("partner") ||
    lowerQuestion.includes("marriage")
  ) {
    category = "love"
  } else if (
    lowerQuestion.includes("job") ||
    lowerQuestion.includes("career") ||
    lowerQuestion.includes("work") ||
    lowerQuestion.includes("business")
  ) {
    category = "career"
  } else if (
    lowerQuestion.includes("health") ||
    lowerQuestion.includes("healing") ||
    lowerQuestion.includes("wellness") ||
    lowerQuestion.includes("body")
  ) {
    category = "health"
  } else if (
    lowerQuestion.includes("spirit") ||
    lowerQuestion.includes("soul") ||
    lowerQuestion.includes("meditation") ||
    lowerQuestion.includes("consciousness")
  ) {
    category = "spiritual"
  }

  // Combine the main prompt with the category context
  return `${ORACLE_SYSTEM_PROMPT}\n\n${CATEGORY_CONTEXTS[category]}`
}

/**
 * Generate a fallback response when the LLM API is unavailable
 * @param question The user's question
 * @returns A mystical response
 */
export function generateFallbackResponse(question: string): string {
  // Analyze the question to generate a more contextual response
  const questionLower = question.toLowerCase()

  // Define some response templates
  const introductions = [
    "The cosmic energies align to reveal... ",
    "The ancient wisdom speaks through the veil of time... ",
    "The oracle contemplates your inquiry with deep insight... ",
    "The mystical forces unveil patterns in the cosmic tapestry... ",
    "The ethereal plane resonates with your seeking... ",
  ]

  const midSections = [
    "As the stars shift their celestial dance, they whisper of ",
    "The threads of fate intertwine, showing ",
    "The ancient symbols illuminate ",
    "The cosmic mirror reflects ",
    "The veil between worlds thins, revealing ",
  ]

  const conclusions = [
    "Trust in the journey that unfolds before you.",
    "Embrace the wisdom that resonates within your soul.",
    "The answer you seek is already within you, waiting to be discovered.",
    "Patience will reveal what is currently hidden from view.",
    "The path forward becomes clear when you listen to your intuition.",
  ]

  // Generate a contextual response based on question keywords
  let contextualResponse = ""

  if (questionLower.includes("future") || questionLower.includes("will") || questionLower.includes("going to")) {
    contextualResponse =
      "The future is a river with many branches. I see potential paths, but your choices will determine which one manifests. "
  } else if (questionLower.includes("love") || questionLower.includes("relationship")) {
    contextualResponse =
      "The heart's journey is complex and beautiful. The connections you seek are reflected in the cosmic patterns. "
  } else if (questionLower.includes("work") || questionLower.includes("career") || questionLower.includes("job")) {
    contextualResponse =
      "Your life's work is a reflection of your inner purpose. The cosmic forces suggest alignment between passion and action. "
  } else if (questionLower.includes("health") || questionLower.includes("healing")) {
    contextualResponse = "The body and spirit are interconnected vessels. Balance in one creates harmony in the other. "
  } else if (questionLower.includes("meaning") || questionLower.includes("purpose")) {
    contextualResponse =
      "Purpose is not found but created through the alchemy of intention and action. Your unique essence contributes to the cosmic symphony. "
  }

  // Construct the full response
  const randomIntro = introductions[Math.floor(Math.random() * introductions.length)]
  const randomMid = midSections[Math.floor(Math.random() * midSections.length)]
  const randomConclusion = conclusions[Math.floor(Math.random() * conclusions.length)]

  return `${randomIntro}${contextualResponse}${randomMid}the patterns that guide your current journey. ${randomConclusion}`
}
