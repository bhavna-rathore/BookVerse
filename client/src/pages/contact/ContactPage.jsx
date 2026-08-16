import React, { useState } from "react";
import { FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import API from "../../api";
import "./ContactPage.css"; // Optional CSS file

const ContactPage = () => {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setSubmitting(true);
    try {
      await API.post("/contact", formData);
      setStatus("Message sent! I'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-container">
      <h2>Get in Touch</h2>
      <p>Have feedback, questions, or ideas? I’d love to hear from you!</p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <textarea
          name="message"
          rows="5"
          placeholder="Your Message"
          value={formData.message}
          onChange={handleChange}
          required
        ></textarea>

        <button type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send Message"}
        </button>
        {status && <p className="form-status">{status}</p>}
        {error && <p className="form-error">{error}</p>}
      </form>

      <div className="social-links">
        <p>Follow me:</p>
        <a href="https://instagram.com" target="_blank" rel="noreferrer"><FaInstagram /></a>
        <a href="https://twitter.com" target="_blank" rel="noreferrer"><FaTwitter /></a>
        <a href="https://linkedin.com" target="_blank" rel="noreferrer"><FaLinkedin /></a>
      </div>
    </div>
  );
};

export default ContactPage;
