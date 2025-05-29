import * as React from "react";

export const Toaster: React.FC = () => {
  return (
    <div className="fixed bottom-0 right-0 m-4 p-4 bg-white shadow-lg rounded-lg">
      <p>Toaster Notification</p>
    </div>
  );
}; 