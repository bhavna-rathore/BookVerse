import "./header.css"

export default function Header() {
  const bg = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80";

  return (
    <div className='header'>
      <div className="headerTitles">
        <span className="headerTitlelg">BookVerse</span>
        <span className="headerTitlesm">Discover, Review, Share Books</span>
      </div>
      <div className="headerImgWrapper">
        <img className="headerImg" src={bg} alt="books background" />
        <div className="headerOverlay"></div>
      </div>
    </div>
  )
}

