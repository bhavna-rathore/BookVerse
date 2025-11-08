import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Post from "../../components/post/Post";
import axios from "axios";
import "./category.css";
import { useLocation } from "react-router";

export default function CategoryPage() {
  const { name } = useParams(); 
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { search } = useLocation();
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const cat = decodeURIComponent(name);
        const res = await axios.get(`/posts?category=${encodeURIComponent(cat)}` + search);
        setPosts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load category posts", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [name]);

  const decodedName = decodeURIComponent(name);

  return (
    <main className="category-page">
      <header className="category-header">
        <h1>{decodedName}</h1>
        <p>{posts.length} review{posts.length !== 1 ? "s" : ""}</p>
      </header>

      {loading ? (
        <div>Loading...</div>
      ) : posts.length === 0 ? (
        <div>No reviews found in this category.</div>
      ) : (
        <section className="category-list">
          {posts.map((p) => (
            <Post key={p._id || p.id} post={p} />
          ))}
        </section>
      )}
    </main>
  );
}