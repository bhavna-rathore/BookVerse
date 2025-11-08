import React, { useState } from "react";
import { FaEnvelope, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import "./ContactPage.css"; // Optional CSS file

const ContactPage = () => {
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API submission
    console.log("Sending form data:", formData);
    setStatus("Message sent! I'll get back to you soon.");
    setFormData({ name: "", email: "", message: "" });
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

        <button type="submit">Send Message</button>
        {status && <p className="form-status">{status}</p>}
      </form>
{/* 
      <div className="contact-email">
        <FaEnvelope /> Email me directly: <a href="mailto:yourblog@email.com">yourblog@email.com</a>
      </div> */}

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
