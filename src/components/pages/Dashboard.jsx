import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { updateUserDisplayName } from "../../services/userService.js";

function Dashboard() {
  const { user } = useAuth();
  const [newDisplayName, setNewDisplayName] = useState("");
  const [updating, setUpdating] = useState(false);

  async function handleUpdateDisplayName(event) {
    event.preventDefault();
    if (!newDisplayName.trim()) return;

    try {
      setUpdating(true);
      await updateUserDisplayName(user, newDisplayName.trim());
      window.location.reload();
    } catch (err) {
      alert("Failed to update display name. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="container mt-5">
      <h2>🎬 Dashboard</h2>
      <div className="alert alert-success">
        <h4>Welcome to your dashboard!</h4>
        <p>
          <strong>You are successfully logged in!</strong>
        </p>
        <hr />
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        <p>
          <strong>User ID:</strong> {user?.uid}
        </p>
        <p>
          <strong>Display Name:</strong> {user?.displayName || "Not set"}
        </p>
      </div>
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Update Display Name</h5>
          <form onSubmit={handleUpdateDisplayName} className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Enter new display name"
              value={newDisplayName}
              onChange={(event) => setNewDisplayName(event.target.value)}
              disabled={updating}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updating || !newDisplayName.trim()}
            >
              {updating ? "Updating..." : "Update"}
            </button>
          </form>
        </div>
      </div>
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Watchlist</h5>
              <p className="card-text">Movies and shows you want to watch</p>
              <button className="btn btn-primary btn-sm">Coming Soon</button>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Completed</h5>
              <p className="card-text">Movies and shows you've finished</p>
              <button className="btn btn-primary btn-sm">Coming Soon</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
