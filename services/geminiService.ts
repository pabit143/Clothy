
import { GoogleGenAI, Modality } from "@google/genai";

interface ImageData {
  base64: string;
  mimeType: string;
}

export async function generateVirtualTryOnImage(
  personImage: ImageData,
  clothingImage: ImageData
): Promise<string> {
  // Assume API_KEY is set in the environment
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const personImagePart = {
    inlineData: {
      data: personImage.base64,
      mimeType: personImage.mimeType,
    },
  };

  const clothingImagePart = {
    inlineData: {
      data: clothingImage.base64,
      mimeType: clothingImage.mimeType,
    },
  };

  const textPart = {
    text: "Using the two images provided, superimpose the clothing item from the second image onto the person in the first image. The fit should be realistic and natural. The output must be a high-quality, photorealistic image showing only the final result of the person wearing the clothing.",
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [personImagePart, clothingImagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // Find the image part in the response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData && part.inlineData.mimeType.startsWith('image/')
    );

    if (imagePart && imagePart.inlineData) {
      return imagePart.inlineData.data;
    } else {
      throw new Error("The API did not return a valid image. The response might have been blocked or did not meet safety guidelines.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate image. The model may be unavailable or the request was invalid.");
  }
}
