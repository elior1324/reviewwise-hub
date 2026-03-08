import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DeleteAccountButton = () => {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  const handleRequest = () => {
    // Open mailto with pre-filled subject
    window.location.href =
      "mailto:reviewhub.il@gmail.com?subject=" +
      encodeURIComponent("בקשת מחיקת חשבון") +
      "&body=" +
      encodeURIComponent(
        "שלום,\n\nאני מבקש/ת למחוק את חשבוני ואת כל המידע האישי שלי מ-ReviewHub.\n\nתודה."
      );
    setSent(true);
    toast({
      title: "נפתח חלון מייל",
      description: "שלחו את המייל ל-reviewhub.il@gmail.com ונטפל בבקשתכם תוך 30 יום.",
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs gap-1.5">
          <Trash2 size={14} />
          מחיקת חשבון
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">מחיקת חשבון</AlertDialogTitle>
          <AlertDialogDescription className="text-right leading-relaxed">
            בקשת מחיקת חשבון תישלח ל-ReviewHub באימייל. לאחר אישור הבקשה, כל המידע האישי שלכם יימחק תוך 30 יום, בכפוף למגבלות חוקיות.
            <br /><br />
            <strong className="text-destructive">שימו לב:</strong> פעולה זו אינה הפיכה. כל הביקורות, הנתונים והפרופיל שלכם יימחקו לצמיתות.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRequest}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            שלחו בקשת מחיקה
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountButton;
