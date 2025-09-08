
import { GoogleGenAI, Type, Modality } from "@google/genai";
// Fix: `Gender` is an enum used as a value, so it needs to be a regular import, not a type-only import.
import { Gender, type PersonalColorAnalysis, type KBeautyStyle, type ShotType, type ColorInfo, type KoreanCelebrity, type FashionTips, type HairStylingTip, type FashionItem } from '../types';

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

export const findCelebrityImageFromWeb = async (celebrityName: string): Promise<string> => {
  const prompt = `Perform an image search for the globally well-known Korean celebrity '${celebrityName}'. From the search results, find one single, high-quality, publicly accessible image. Provide a direct, hotlinkable URL for this image. The URL must end in a common image format like .jpg, .png, or .webp. Do not provide a URL to a search results page.`;

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
    
    console.warn("findCelebrityImageFromWeb with schema did not return a valid image URL, response was:", jsonText);
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
        type: Type.OBJECT,
        description: "A detailed object with specific K-beauty makeup recommendations suitable for the user's gender. For each item, provide the product type, brand examples, and a relevant K-beauty technique (e.g., 'gradient lips').",
        properties: {
            face: {
                type: Type.ARRAY,
                description: "Recommendations for face makeup.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        product: { type: Type.STRING, description: "The product type and brand, e.g., 'Cushion Foundation (Brand: CLIO)'." },
                        technique: { type: Type.STRING, description: "A relevant K-beauty technique, e.g., 'Apply a thin layer for a glass skin effect.'." }
                    },
                    required: ["product", "technique"]
                }
            },
            eyes: {
                type: Type.ARRAY,
                description: "Recommendations for eye makeup.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        product: { type: Type.STRING, description: "The product type and brand, e.g., 'Neutral Eyeshadow Palette (Brand: peripera)'." },
                        technique: { type: Type.STRING, description: "A relevant K-beauty technique, e.g., 'Create Aegyo Sal under the eyes for a youthful look.'." }
                    },
                    required: ["product", "technique"]
                }
            },
            lips: {
                type: Type.ARRAY,
                description: "Recommendations for lip products.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        product: { type: Type.STRING, description: "The product type and brand, e.g., 'Velvet Lip Tint (Brand: rom&nd)'." },
                        technique: { type: Type.STRING, description: "A relevant K-beauty technique, e.g., 'Apply on inner lips and blend out for a gradient effect.'." }
                    },
                    required: ["product", "technique"]
                }
            },
            generalTip: {
                type: Type.STRING,
                description: "A concluding sentence or a general tip about the overall makeup look."
            }
        },
        required: ["face", "eyes", "lips", "generalTip"]
    },
    fashionTips: {
        type: Type.OBJECT,
        description: "A detailed object with K-beauty fashion advice. For each item, provide a brief reason. Provide specific lists for key clothing items, fabrics, and accessories. Also include a general style inspiration tip.",
        properties: {
            clothingItems: {
                type: Type.ARRAY,
                description: "A list of 3-4 key clothing items. For each, explain why it's recommended.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        item: { type: Type.STRING, description: "The name of the clothing item, e.g., 'Oversized blazer'." },
                        reason: { type: Type.STRING, description: "A brief reason why this item suits the user's color season." }
                    },
                    required: ["item", "reason"]
                }
            },
            fabricsAndTextures: {
                type: Type.ARRAY,
                description: "A list of 2-3 recommended fabrics or textures. For each, explain why it's recommended.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        item: { type: Type.STRING, description: "The name of the fabric or texture, e.g., 'Linen'." },
                        reason: { type: Type.STRING, description: "A brief reason why this fabric suits the user's color season." }
                    },
                    required: ["item", "reason"]
                }
            },
            accessories: {
                type: Type.ARRAY,
                description: "A list of 2-3 accessory recommendations. For each, explain why it's recommended.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        item: { type: Type.STRING, description: "The name of the accessory, e.g., 'Silver jewelry'." },
                        reason: { type: Type.STRING, description: "A brief reason why this accessory suits the user's color season." }
                    },
                    required: ["item", "reason"]
                }
            },
            styleInspiration: {
                type: Type.STRING,
                description: "A concluding sentence summarizing the fashion style or mentioning a current Korean fashion trend."
            }
        },
        required: ["clothingItems", "fabricsAndTextures", "accessories", "styleInspiration"]
    },
    hairColorRecommendations: {
      type: Type.ARRAY,
      description: "An array of 2-3 trendy Korean hair color recommendations that would suit the user (e.g., Ash Brown, Milk Tea Beige).",
      items: {
        type: Type.STRING
      }
    },
    hairStylingTips: {
      type: Type.ARRAY,
      description: "An array of 2-3 K-beauty hair styling recommendations. For each style, include a brief description and a list of specific products or tools to achieve it.",
      items: {
        type: Type.OBJECT,
        properties: {
          style: {
            type: Type.STRING,
            description: "The name of the hairstyle, e.g., 'Soft Waves', 'See-through Bangs'."
          },
          description: {
            type: Type.STRING,
            description: "A brief, one-sentence description of the hairstyle."
          },
          products: {
            type: Type.ARRAY,
            description: "A list of 2-3 recommended products or tools, e.g., 'Texturizing spray', '32mm curling iron'.",
            items: {
              type: Type.STRING
            }
          }
        },
        required: ["style", "description", "products"]
      }
    }
  },
  required: ["season", "description", "palette", "colorsToAvoid", "koreanCelebrity", "makeupTips", "fashionTips", "hairColorRecommendations", "hairStylingTips"]
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

    For makeup, recommend specific K-beauty products, popular brands, and application techniques suitable for their gender. 
    For fashion, recommend specific clothing items, fabrics, and accessories relevant to Korean style; for each, provide a brief reason why it suits the user's personal color.
    Also suggest trendy Korean hair colors. For hair styling, recommend 2-3 K-beauty styles suitable for their gender. For each style, provide a brief description and a list of 2-3 specific product types or tools (e.g., 'Sea salt spray', '32mm curling iron', 'Hair essence') needed to achieve it.
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

const formatFashionTipsForPrompt = (tips: FashionTips): string => {
    const clothing = `Key items to wear include ${tips.clothingItems.map(i => i.item).join(', ')}.`;
    const fabrics = `Focus on fabrics like ${tips.fabricsAndTextures.map(i => i.item).join(', ')}.`;
    // Accessories are now handled separately in the main prompt.
    return `${clothing} ${fabrics} Overall, the style is about ${tips.styleInspiration}.`;
};


export const transformImage = async (
  imageBase64: string,
  season: string,
  fashionTips: FashionTips,
  gender: Gender,
  style: KBeautyStyle,
  shotType: ShotType,
  palette?: ColorInfo[],
  generateNewVariant?: boolean
): Promise<{ newImageBase64: string; description: string }> => {
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg',
      },
    };

    let makeupInstruction = "Apply stylish K-beauty makeup that matches their season and the selected aesthetic.";
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
            styleInstruction = `Create a polished, high-fashion portrait of the user, as if they were being photographed for the cover of a top Korean fashion magazine. The aesthetic is artistic, sophisticated, and trendy. This is a creative, stylized illustration, not a simple photo edit.`;
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

    const fashionTipsString = formatFashionTipsForPrompt(fashionTips);
    const colorNames = palette && palette.length > 0 ? palette.map(c => c.name).join(', ') : 'the provided seasonal colors';
    const accessoriesString = fashionTips.accessories.map(tip => tip.item).join(', ');
    
    const variationInstruction = generateNewVariant
        ? `
**Critical Creative Direction:** This is a request for a *new variation*. The generated outfit **must be fundamentally different** from any previous styles. Do not just change colors on the same clothing items. Create a completely new outfit composition using a different combination of items from the style guide. You must showcase significant variety.
- **Experiment Boldly:** Combine different tops, bottoms, outerwear, and accessories.
- **Vary Color Schemes:** Use a new primary color combination from the user's palette for each generation.`
        : '';

    const fashionInstruction = `
**Core Task:** Redesign the user's outfit completely to create a diverse set of fashionable looks based on a comprehensive style guide.
${variationInstruction}
**Creative Brief:**
1.  **Seasonal Theme:** Randomly select one of the four seasons (Spring, Summer, Autumn, or Winter) and design a complete outfit that is seasonally appropriate and fashionable. The chosen season should influence the type of clothing (e.g., a light dress for summer, a cozy coat for winter).
2.  **Personal Color Palette:** The new outfit's color scheme **must** be based on the user's personal color palette: **${colorNames}**. Actively use different combinations of these colors to show variety.
3.  **Recommended Fashion Items:** Intelligently and creatively incorporate elements from the user's personalized fashion recommendations: **"${fashionTipsString}"**. Prioritize variety in the items chosen for each look.
4.  **Accessories (Optional):** To enhance the style, you may optionally add accessories. If you do, select from this list: **${accessoriesString}**. The decision to include accessories and which specific ones to use should be made randomly to create more varied and interesting styles.
5.  **Style Inspiration:** The overall vibe should be inspired by modern K-beauty and celebrity fashion trends. The goal is to create a sophisticated, stylish, and cohesive look.
6.  **Chosen Aesthetic:** All fashion choices must align perfectly with the selected theme: **'${style}'**.
7.  **Cohesion:** The final look must be cohesive, fashionable, and suitable for the user's gender and personal color season ('${season}').
`;

    const facePreservationRequirement = `**CRITICAL REQUIREMENT: Preserve the original face.** The user's face from the provided photo **must be used exactly as is**. This is the single most important rule. Do not alter their core facial structure, features (eyes, nose, mouth), or identity. The goal is a realistic visualization of a makeover on the *actual person* in the photo, not the creation of a new, different person. The final image must be instantly recognizable as the original individual.`;
    
    const artisticDirection = `**Artistic Direction & Quality:**
*   **Realism:** Aim for hyper-realism and photorealism. The result should look like a real photograph.
*   **Details:** Generate an image with extremely high detail, as if taken with a professional DSLR camera. Include realistic skin texture, hair strands, and fabric details.
*   **Lighting:** Apply cinematic, professional studio lighting that enhances the user's features and the overall mood.
*   **Focus:** The user's face must be in sharp focus.
*   **Resolution:** The output should be of the highest possible quality, equivalent to 8K UHD.`;

    let promptText: string;

    if (style === 'Celebrity Inspired') {
        promptText = `**Primary Task: Create a hyper-realistic, photorealistic fashion portrait of the user, using their photo as a base. Your response MUST include the edited image.**

${facePreservationRequirement}

**Framing:** ${shotInstruction}

**Theme:** The artistic aesthetic for this portrait is **'${style}'**.
*Theme Description:* ${styleInstruction}

${artisticDirection}

**User Profile for Styling:**
*   **Gender:** ${gender}
*   **Personal Color Season:** ${season}

**Transformation Guidelines:**
1.  **Face Synthesis:** Keep the user's face, but seamlessly blend it into the new artistic scene.
2.  **Makeup:** ${makeupInstruction} Apply makeup that fits the high-fashion, magazine-cover aesthetic.
3.  **Hair:** Change the hair to a trendy Korean style and color that suits the artistic concept and the user's season.
4.  **Fashion Details:**
${fashionInstruction}

**Output Requirement:**
After generating the edited image, provide a short, single-paragraph text description of the changes made (makeup, hair, fashion) and how they align with the '${style}' theme and the requested framing (${shotDescription}). Do not respond with only text.`;
    } else {
        promptText = `**Primary Task: Edit the user's photo to give them a complete K-beauty makeover, resulting in a hyper-realistic, photorealistic image. Your response MUST include the edited image.**

${facePreservationRequirement}

**Framing:** ${shotInstruction}

**Theme:** The aesthetic for this makeover is **'${style}'**.
*Theme Description:* ${styleInstruction}

${artisticDirection}

**User Profile for Styling:**
*   **Gender:** ${gender}
*   **Personal Color Season:** ${season}

**Transformation Guidelines:**
1.  **Face Synthesis:** Keep the user's face, but seamlessly blend it into the new scene.
2.  **Makeup:** ${makeupInstruction}
3.  **Hair:** Change the hair to a trendy Korean style and color that suits their season and the theme.
4.  **Fashion Details:**
${fashionInstruction}

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
