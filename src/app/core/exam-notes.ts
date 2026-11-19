/** Exam page text (tips and extra rules), kept out of the route list so it loads only with the exam page. */
const PHOTO_NOTE = 'Recent colour photo, light/white background, face clearly visible, no cap or dark glasses.';
const SIGN_NOTE = 'Sign with a black or blue pen on white paper. Signature in CAPITAL letters is not accepted.';

/** One exam-specific tip per exam that makes each page genuinely useful (and unique). */
export const EXAM_TIPS: Record<string, string> = {
  "ssc": 'SSC now captures a live photo through the webcam in many forms. Use this resizer for the OTR or any SSC form that still asks you to upload a photo, and always for the signature.',
  "upsc": 'UPSC asks for the candidate’s name and the date the photo was taken printed on the photo, and the photo must not be older than 10 days. Turn on “Name & date on photo” below.',
  "ibps": 'IBPS also asks for a left thumb impression and a handwritten declaration in English — use the tabs above for those. The declaration must be in your own handwriting, not in capital letters.',
  "sbi": 'SBI uses the same sizes as IBPS. Blurred or group photos are rejected — crop tightly around your face and shoulders.',
  "rrb": 'RRB forms reject photos with caps, sunglasses or a dark background. The same photo is used on your admit card, so use a clear, recent one.',
  "tspsc": 'Update your photo and signature once in the TGPSC OTR — every application then uses them. Keep the original high-quality photo in case the size rules change.',
  "appsc": 'APPSC OTPR keeps one photo and signature for all applications. The photo should be taken in the last few months and match how you will look at the exam.',
  "neet": 'NEET also asks for a postcard-size (4″ × 6″) photo — upload that as it is if it is already under 200 KB, or use the generic resizer below.',
  "jee-main": 'NTA rejects photos with a cap, goggles or a selfie-style angle. Ask someone to take the photo straight on against a plain wall.',
};

/** Extra rule shown under each size (cm size, background, etc.), by "slug/kind". */
export const DOC_NOTES: Record<string, string> = {
  "ssc/photo": `About 3.5 cm × 4.5 cm, JPG. ${PHOTO_NOTE}`,
  "ssc/signature": `About 4 cm × 2 cm, JPG. ${SIGN_NOTE}`,
  "upsc/photo": `JPG, name and date of photo printed at the bottom. ${PHOTO_NOTE}`,
  "upsc/signature": `JPG. Upload 3 signatures one below another if the form asks. ${SIGN_NOTE}`,
  "ibps/photo": `4.5 cm × 3.5 cm, JPG. ${PHOTO_NOTE}`,
  "ibps/signature": `JPG. ${SIGN_NOTE}`,
  "ibps/thumb": 'Left thumb with blue or black ink on white paper, 3 cm × 3 cm, JPG.',
  "ibps/declaration": 'Declaration text in English in your own handwriting (not capitals), 10 cm × 5 cm, JPG.',
  "sbi/photo": `JPG. ${PHOTO_NOTE}`,
  "sbi/signature": `JPG. ${SIGN_NOTE}`,
  "sbi/thumb": 'Left thumb with blue or black ink on white paper, JPG.',
  "sbi/declaration": 'Declaration in English in your own handwriting, JPG.',
  "rrb/photo": `35 mm × 45 mm, JPG. ${PHOTO_NOTE}`,
  "rrb/signature": `50 mm × 20 mm, JPG. ${SIGN_NOTE}`,
  "tspsc/photo": `3.5 cm × 4.5 cm, JPG. ${PHOTO_NOTE}`,
  "tspsc/signature": `3.5 cm × 1.5 cm, JPG. ${SIGN_NOTE}`,
  "appsc/photo": `3.5 cm × 4.5 cm, JPG. ${PHOTO_NOTE}`,
  "appsc/signature": `3.5 cm × 1.5 cm, JPG. ${SIGN_NOTE}`,
  "neet/photo": `Passport size, JPG, 80% face coverage, white background. ${PHOTO_NOTE}`,
  "neet/signature": `JPG. ${SIGN_NOTE}`,
  "neet/thumb": 'Left thumb impression in blue/black ink on white paper, JPG.',
  "jee-main/photo": `Passport size, JPG, white background. ${PHOTO_NOTE}`,
  "jee-main/signature": `JPG. ${SIGN_NOTE}`,
};
