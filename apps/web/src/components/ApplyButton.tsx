import { useState } from "react";

interface Props {
  onApply: () => void;
  onSkip: () => void;
}

export function ApplyButton({ onApply, onSkip }: Props) {
  const [bursting, setBursting] = useState(false);

  const handleApply = () => {
    setBursting(true);
    onApply();
    setTimeout(() => setBursting(false), 700);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <button
        onClick={handleApply}
        className="btn-primary w-full py-5 text-xl relative overflow-hidden"
      >
        <span className="relative z-10">🌸 塗ったよ</span>
        {bursting && (
          <span className="absolute inset-0 bg-white/40 animate-ping rounded-full" />
        )}
      </button>
      <button
        onClick={onSkip}
        className="text-mochi-400 text-sm py-2 hover:text-mochi-500 transition"
      >
        今は塗らない
      </button>
    </div>
  );
}
