import { localizePrices } from "../services/currency-service";
import { Request, Response, NextFunction } from 'express';

export const localizeResponseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Save the original res.json function
  const originalJson = res.json;

  // Overwrite the res.json function
  res.json = async function (data: any) {
    
    // Check if the response data is a structure containing prices
    const shouldProcess = (
      (data && data.basePrice !== undefined) || 
      (Array.isArray(data) && data.length > 0 && data[0].basePrice !== undefined)
    );

    if (shouldProcess) {
      try {
        // Call the asynchronous localization service and await the modified data
        const localizedData = await localizePrices(req, data);
        
        // Call the original res.json with the MODIFIED data
        return originalJson.call(this, localizedData);
      } catch (error) {
        console.error("Localization Middleware Error. Sending original data.", error);
        // Fallback: send original data in BDT
        return originalJson.call(this, data);
      }
    }
    
    // For all non-price responses, proceed normally
    return originalJson.call(this, data);
  };

  next();
};