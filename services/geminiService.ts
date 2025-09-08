import { GoogleGenAI, Type, Modality } from "@google/genai";
// Fix: `Gender` is an enum used as a value, so it needs to be a regular import, not a type-only import.
import { Gender, type PersonalColorAnalysis, type KBeautyStyle, type ShotType, type ColorInfo, KoreanCelebrity } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const imageSearchSchema = {
    type: Type.OBJECT,
    properties: {
        imageUrl: {
            type: Type.STRING,
            description: "A direct, hotlinkable, high-quality image URL for the celebrity. The URL must end in a common image format like .jpg, .png, or .webp. Prioritize stable sources like Wikimedia Commons."
        }
    },
    required: ["imageUrl"]
};

export const findCelebrityImage = async (celebrityName: string): Promise<string> => {
  const prompt = `Find a single, high-quality, publicly accessible, and directly embeddable image URL for the globally well-known Korean celebrity '${celebrityName}'.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: imageSearchSchema,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    const imageUrl = result.imageUrl;

    if (imageUrl && typeof imageUrl === 'string') {
        try {
            // This will throw an error for invalid URLs
            new URL(imageUrl); 
            if ((/\.(jpg|jpeg|png|webp)$/i).test(imageUrl)) {
                return imageUrl;
            }
        } catch (_) {
            // Invalid URL format, fall through to the fallback
        }
    }
    
    console.warn("findCelebrityImage with schema did not return a valid image URL, response was:", jsonText);
    return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(celebrityName)}`;

  } catch (error) {
    console.error(`Error finding image for ${celebrityName}:`, error);
    // Fallback to a google search link if API fails
    return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(celebrityName)}`;
  }
};


const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    season: {
      type: Type.STRING,
      description: "The user's personal color season, e.g., 'Cool Winter', 'Warm Autumn', 'Light Spring', 'Deep Winter'."
    },
    description: {
      type: Type.STRING,
      description: "A detailed paragraph explaining why the user fits into this season, based on their skin undertone, hair, and eye color."
    },
    palette: {
      type: Type.ARRAY,
      description: "An array of 10-12 recommended colors for the user's palette.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The name of the color, e.g., 'Icy Blue', 'Terracotta', 'Sage Green'."
          },
          hex: {
            type: Type.STRING,
            description: "The hex code for the color, e.g., '#A6D5E3'."
          }
        },
        required: ["name", "hex"]
      }
    },
    colorsToAvoid: {
      type: Type.ARRAY,
      description: "An array of 3-4 colors that are unflattering for the user and should be avoided.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The name of the color to avoid, e.g., 'Neon Orange', 'Dull Brown'."
          },
          hex: {
            type: Type.STRING,
            description: "The hex code for the color, e.g., '#FF5733'."
          }
        },
        required: ["name", "hex"]
      }
    },
    koreanCelebrity: {
        type: Type.OBJECT,
        description: "Information about a matching Korean celebrity who is globally well-known.",
        properties: {
            name: {
                type: Type.STRING,
                description: "The name of the celebrity, e.g., 'Jennie', 'V', 'Son Ye-jin', 'Gong Yoo'."
            },
            description: {
                type: Type.STRING,
                description: "A friendly sentence describing the match, e.g., 'You have a tone similar to Jennie (제니 톤)'."
            },
        },
        required: ["name", "description"]
    },
    makeupTips: {
        type: Type.STRING,
        description: "A paragraph with specific K-beauty makeup recommendations suitable for the user's gender. For women, include popular products like lip tints, cushion foundations, and eyeshadow colors. For men, suggest subtle options like concealers, BB creams, or tinted lip balms."
    },
    fashionTips: {
        type: Type.STRING,
        description: "A paragraph with fashion advice, including best metals (gold/silver), neutral colors, and how to combine colors effectively."
    },
    hairColorRecommendations: {
      type: Type.ARRAY,
      description: "An array of 2-3 trendy Korean hair color recommendations that would suit the user (e.g., Ash Brown, Milk Tea Beige).",
      items: {
        type: Type.STRING
      }
    }
  },
  required: ["season", "description", "palette", "colorsToAvoid", "koreanCelebrity", "makeupTips", "fashionTips", "hairColorRecommendations"]
};

type PartialAnalysisResult = Omit<PersonalColorAnalysis, 'koreanCelebrity'> & {
  koreanCelebrity: Omit<KoreanCelebrity, 'celebrityImageURL'>
};

export const analyzePersonalColor = async (imageBase64: string, gender: Gender): Promise<PartialAnalysisResult> => {
  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: 'image/jpeg',
    },
  };

  const textPart = {
    text: `Analyze the user's selfie to determine their personal color season from a K-beauty perspective. The user has identified their gender as '${gender}'.
    Focus on their skin undertone (cool, warm, neutral), eye color, and hair color.
    Provide a detailed analysis based on these features.
    The analysis should include Korean-specific recommendations. For the celebrity match, choose a globally well-known Korean celebrity that matches the user's gender (${gender}) and personal color season. Use a friendly tone like "You have a tone similar to V (뷔 톤)".
    
    IMPORTANT: Do NOT provide an image URL for the celebrity. Only provide their name and a descriptive sentence.

    For makeup, recommend K-beauty products suitable for their gender. Also suggest trendy Korean hair colors.
    In addition to the recommended palette, please also provide a list of 3-4 colors the user should avoid.
    Ensure the user has natural lighting and minimal makeup for best results.
    Provide the result in the specified JSON format.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (result && result.season && result.palette) {
      return result as PartialAnalysisResult;
    } else {
      throw new Error("Invalid response structure from API.");
    }
  } catch (error) {
    console.error("Error analyzing personal color:", error);
    throw new Error("Failed to analyze the image. Please try again with a clear, well-lit photo.");
  }
};

export const transformImage = async (
  imageBase64: string,
  season: string,
  celebrityName: string,
  fashionTips: string,
  gender: Gender,
  style: KBeautyStyle,
  shotType: ShotType,
  palette?: ColorInfo[]
): Promise<{ newImageBase64: string; description: string }> => {
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg',
      },
    };

    let makeupInstruction = "Apply stylish K-beauty makeup that matches their season and the celebrity's aesthetic.";
    if (gender === Gender.Male) {
        makeupInstruction = "Apply subtle K-beauty makeup suitable for men. Focus on creating a clean, even complexion, grooming the eyebrows, and perhaps adding a touch of natural lip color.";
    }
    
    let styleInstruction = '';
    switch (style) {
        case 'Natural Glow':
            styleInstruction = "Focus on dewy skin, soft and neutral makeup tones, and comfortable yet stylish everyday fashion. Hair should look healthy and natural.";
            break;
        case 'Bold & Chic':
            styleInstruction = "This involves more prominent makeup, like sharp eyeliner or a defined lip color (subtle for men), combined with modern, sophisticated fashion. Hair can be more styled and trendy.";
            break;
        case 'Vintage K-drama':
            styleInstruction = "Use a soft-focus, romantic filter. Makeup should feature muted, soft tones. Fashion should be nostalgic and elegant, inspired by classic Korean dramas. Hair should be soft and perhaps wavy.";
            break;
        case 'Celebrity Inspired':
            styleInstruction = `Directly emulate the signature style of the celebrity inspiration, ${celebrityName}. Apply their makeup, hair, and fashion aesthetic to the user. **CRITICAL:** The user's original face and facial features MUST be preserved. The goal is to composite the user's face onto a new, celebrity-inspired look.`;
            break;
    }

    let shotInstruction = '';
    let shotDescription = '';
    switch (shotType) {
        case 'Bust':
            shotInstruction = "Generate a bust shot (from the chest up). Focus on detailed makeup and hair.";
            shotDescription = "a bust shot";
            break;
        case 'Waist':
            shotInstruction = "Generate a waist shot (from the waist up). Show the upper body fashion and hairstyle.";
            shotDescription = "a waist shot";
            break;
        case 'Full':
            shotInstruction = "Generate a full-body shot. Showcase the complete fashion outfit from head to toe.";
            shotDescription = "a full shot";
            break;
    }

    let fashionInstruction = `Creatively redesign the user's outfit by interpreting and applying the following personalized fashion advice: "${fashionTips}". It is crucial that you adapt these tips to perfectly match the chosen '${style}' aesthetic and the user's '${season}' personal color season. The goal is a cohesive, stylish, and fashionable look.`;
    if (palette && palette.length > 0) {
        const colorNames = palette.map(c => c.name).join(', ');
        fashionInstruction += ` Furthermore, when generating this new clothing variation, style the outfit using a creative combination of colors from the user's personal palette, which includes: ${colorNames}.`;
    }

    let promptText: string;

    if (style === 'Celebrity Inspired') {
        promptText = `**Primary Task: Edit the user's photo to give them a complete K-beauty makeover, compositing their face into a celebrity-inspired style. Your response MUST include the edited image.**

**CRITICAL REQUIREMENT:** You MUST retain the user's original facial features and identity. The final image must look like the same person from the input photo, but with a new style.

**Framing:** ${shotInstruction}

**Theme:** The aesthetic for this makeover is **'${style}'**.
*Theme Description:* ${styleInstruction}

**User Profile for Styling:**
*   **Gender:** ${gender}
*   **Personal Color Season:** ${season}
*   **Inspiration:** Korean celebrity ${celebrityName}.

**Transformation Guidelines:**
1.  **Face Synthesis:** Keep the user's face, but seamlessly blend it into the new scene.
2.  **Makeup:** ${makeupInstruction} Apply makeup inspired by ${celebrityName}'s signature looks.
3.  **Hair:** Change the hair to a trendy Korean style and color that ${celebrityName} might wear, adapted to suit the user's season.
4.  **Fashion:** ${fashionInstruction} Dress the user in an outfit that reflects ${celebrityName}'s iconic fashion sense.

**Output Requirement:**
After generating the edited image, provide a short, single-paragraph text description of the changes made (makeup, hair, fashion) and how they align with the '${style}' theme and the requested framing (${shotDescription}). Do not respond with only text.`;
    } else {
        promptText = `**Primary Task: Edit the user's photo to give them a complete K-beauty makeover. Your response MUST include the edited image.**

**Framing:** ${shotInstruction}

**Theme:** The aesthetic for this makeover is **'${style}'**.
*Theme Description:* ${styleInstruction}

**User Profile for Styling:**
*   **Gender:** ${gender}
*   **Personal Color Season:** ${season}
*   **Inspiration:** Korean celebrity ${celebrityName}.

**Transformation Guidelines:**
1.  **Makeup:** ${makeupInstruction}
2.  **Hair:** Change the hair to a trendy Korean style and color that suits their season and the theme.
3.  **Fashion:** ${fashionInstruction}

**Output Requirement:**
After generating the edited image, provide a short, single-paragraph text description of the changes made (makeup, hair, fashion) and how they align with the '${style}' theme and the requested framing (${shotDescription}). Do not respond with only text.`;
    }

    const textPart = { text: promptText };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (!response.candidates?.length || !response.candidates[0].content?.parts?.length) {
      console.error("Invalid response structure from image transformation API:", response);
      throw new Error("API returned an invalid response. This may be due to safety filters blocking the request.");
    }

    let newImageBase64: string | null = null;
    let description: string = "Here is your style transformation!";

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        newImageBase64 = part.inlineData.data;
      } else if (part.text) {
        description = part.text;
      }
    }

    if (!newImageBase64) {
      const responseText = response.candidates[0].content.parts.find(p => p.text)?.text || "No text explanation was provided by the model.";
      console.error("API response did not contain an image. Parts received:", JSON.stringify(response.candidates[0].content.parts, null, 2));
      
      const isRefusal = /sorry|cannot|unable/i.test(responseText);
      
      if (isRefusal) {
         throw new Error(`The AI was unable to transform the image. Reason: "${responseText}"`);
      }

      throw new Error("API did not return an edited image. This could be due to the input image quality or a safety policy. Please try again with a different photo or style.");
    }

    return { newImageBase64, description };
  } catch (error) {
    console.error("Error transforming image:", error);
    const message = error instanceof Error ? error.message : "Failed to apply the style transformation. Please try again.";
    throw new Error(message);
  }
};