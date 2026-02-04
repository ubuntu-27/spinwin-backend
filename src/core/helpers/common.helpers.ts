
import path from "path";
import mime from "mime";
import multer from "multer";


export const fileFilter = (req : any , file : any , cb : any) => {
console.log("Received file MIME type:", file.mimetype);

// If MIME type is "application/octet-stream", determine it using file extension
if (file.mimetype === "application/octet-stream") {
    const ext = path.extname(file.originalname); // Get file extension
    const correctedMimeType = mime.lookup(ext); // Get correct MIME type from extension
    file.mimetype = correctedMimeType || "application/octet-stream"; // Fallback if not found
}

if (file.mimetype) {
    cb(null, true);
    } else {
    cb(new Error("Invalid file type"), false);
    }

};

export const storage = multer.diskStorage({
    destination: function (req : any , file : any , cb : any ) {
      
      cb(null, "uploads/"); // Set the upload directory
    },
    filename: function (req : any , file : any , cb : any) {
      // Extract original extension
      const ext = path.extname(file.originalname);
      // Generate a unique filename and keep the extension
      const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + ext;
      cb(null, uniqueName);
    },
  });