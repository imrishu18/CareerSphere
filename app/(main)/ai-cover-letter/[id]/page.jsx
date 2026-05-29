import { getCoverLetter } from "@/actions/cover-letter";
import CoverLetterPreview from "../_components/cover-letter-preview";

export default async function EditCoverLetterPage({ params }) {
  const { id } = await params;
  const coverLetter = await getCoverLetter(id);

  return (
    <div className="py-2">
      <CoverLetterPreview
        id={coverLetter?.id}
        content={coverLetter?.content}
        jobTitle={coverLetter?.jobTitle}
        companyName={coverLetter?.companyName}
      />
    </div>
  );
}
