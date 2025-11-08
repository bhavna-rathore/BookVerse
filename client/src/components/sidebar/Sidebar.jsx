import "./sidebar.css"
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Sidebar()  {
  const [cats, setCats] = useState([]);

  useEffect(() => {
    const getCats = async () => {
      const res = await axios.get("/categories");
      setCats(res.data);
       
    };
    getCats();
  }, []);

  return (
    <div className="sidebar">
     <div className="sidebarItem">
      <span className="sidebarTitle">ABOUT ME </span>
      <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8cGVyc29ufGVufDB8fDB8fA%3D%3D&w=1000&q=80"
       alt=""/>
      <p> 
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque quam
        temporibus fugit minima mollitia quod error praesentium, facilis,
        beatae aliquam modi.
      </p>
      <div className="sidebarItem">
      <span className="sidebarTitle">CATEGOIES </span>
      <ul className="sidebarList">
      {cats.map((c) => (
         <Link to={`/?cat=${c.name}`} className="link">
            <li className="sidebarListItem">{c.name}</li>
            </Link>
          ))}
      </ul>
      </div>
      <div className="sidebarItem">
      <span className="sidebarTitle">FOLLOW US </span>
      <div className="sidebarSocial">
      <i className=" sidebarIcon fa-brands fa-square-facebook" ></i>
      <i className=" sidebarIcon fa-brands fa-square-twitter"></i>
      <i className=" sidebarIcon fa-brands fa-square-instagram"></i>
      <i className=" sidebarIcon fa-brands fa-square-pinterest"></i> 
           
      </div>
      </div>

     </div>
    </div>
  )
}

