import React from 'react';
import { FaHandPaper, FaMousePointer, FaSquare, FaDrawPolygon, FaCircle, FaArrowRight, FaMinus, FaPen, FaFont, FaImage, FaShapes, FaLink, FaEraser, FaProjectDiagram } from 'react-icons/fa';
import { AiOutlineLock, AiOutlineUnlock } from 'react-icons/ai';

const ToolSection = ({ selectedTool, setSelectedTool }) => {
  const tools = [
    { id: 'lock', icon: <AiOutlineLock />, title: 'Lock' },
    { id: 'hand', icon: <FaHandPaper />, title: 'Hand' },
    { id: 'pointer', icon: <FaMousePointer />, title: 'Pointer' },
    { id: 'square', icon: <FaSquare />, title: 'Square' },
    // { id: 'diamond', icon: <FaDrawPolygon />, title: 'Diamond' },
    { id: 'circle', icon: <FaCircle />, title: 'Circle' },
    { id: 'arrow', icon: <FaArrowRight />, title: 'Arrow' },
    { id: 'line', icon: <FaMinus />, title: 'Line' },
    { id: 'pen', icon: <FaPen />, title: 'Pen' },
    { id: 'text', icon: <FaFont />, title: 'Text' },
    // { id: 'image', icon: <FaImage />, title: 'Image' },
    // { id: 'shapes', icon: <FaShapes />, title: 'Shapes' },
    // { id: 'link', icon: <FaLink />, title: 'Link' },
    { id: 'eraser', icon: <FaEraser />, title: 'Eraser' },
    // { id: 'diagram', icon: <FaProjectDiagram />, title: 'Diagram' }
  ];

  return (
    <div className="flex justify-center items-center space-x-2 bg-white shadow-md rounded-lg p-2">
      {tools.map(tool => (
        <button
          key={tool.id}
          className={`p-2 rounded ${selectedTool === tool.id ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
          onClick={() => setSelectedTool(tool.id)}
          title={tool.title}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
};

export default ToolSection;
