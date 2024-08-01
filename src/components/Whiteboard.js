import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Arrow } from 'react-konva';
import Shape from './Shape';
import ToolSection from './ToolSection';
import { FaSquare, FaCircle, FaFont, FaPen, FaHandPaper } from 'react-icons/fa';

// Helper function to interpolate points for smooth drawing
const interpolatePoints = (points, tension = 0.5, numOfSeg = 16) => {
  const result = [];
  const len = points.length;
  for (let i = 0; i < len - 2; i += 2) {
    const p0 = i > 0 ? { x: points[i - 2], y: points[i - 1] } : { x: points[i], y: points[i + 1] };
    const p1 = { x: points[i], y: points[i + 1] };
    const p2 = { x: points[i + 2], y: points[i + 3] };
    const p3 = i !== len - 4 ? { x: points[i + 4], y: points[i + 5] } : { x: points[i + 2], y: points[i + 3] };

    for (let t = 0; t < numOfSeg; t++) {
      const st = t / numOfSeg;
      const st2 = st * st;
      const st3 = st2 * st;
      const c1 = -tension * st3 + 2 * tension * st2 - tension * st;
      const c2 = (2 - tension) * st3 + (tension - 3) * st2 + 1;
      const c3 = (tension - 2) * st3 + (3 - 2 * tension) * st2 + tension * st;
      const c4 = tension * st3 - tension * st2;
      result.push(c1 * p0.x + c2 * p1.x + c3 * p2.x + c4 * p3.x);
      result.push(c1 * p0.y + c2 * p1.y + c3 * p2.y + c4 * p3.y);
    }
  }
  return result;
};

const Whiteboard = () => {
  const [tool, setTool] = useState('pointer');
  const [lines, setLines] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(100);
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const [textEditVisible, setTextEditVisible] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState('');

  const cursorRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.pageX}px`;
        cursorRef.current.style.top = `${e.pageY}px`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const getRelativePointerPosition = (stage) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    return transform.point(pos);
  };

  const handleMouseDown = (e) => {
    const stage = stageRef.current;
    const pos = getRelativePointerPosition(stage);

    if (tool === 'eraser') {
      const clickedOn = stage.getIntersection(pos);
      if (clickedOn) {
        const id = clickedOn.attrs.id;
        setShapes((prevShapes) => prevShapes.filter(shape => shape.id !== id));
        setLines((prevLines) => prevLines.filter(line => line.id !== id));
      }
      return;
    }

    if (tool !== 'pen' && selectedId) {
      setSelectedId(null);
      return;
    }

    isDrawing.current = true;

    if (tool === 'pen') {
      const newLine = {
        id: `line-${lines.length + 1}`,
        tool: tool,
        points: [pos.x, pos.y],
      };
      setLines((prevLines) => [...prevLines, newLine]);
    } else if (tool === 'line' || tool === 'arrow') {
      const newLine = {
        id: `line-${lines.length + 1}`,
        tool: tool,
        points: [pos.x, pos.y, pos.x, pos.y],
      };
      setLines((prevLines) => [...prevLines, newLine]);
    } else if (tool === 'text') {
      setTextEditVisible(true);
      setTextPosition({ x: pos.x, y: pos.y });
      setTextValue('');
    } else {
      const shape = {
        id: `shape-${shapes.length + 1}`,
        type: tool,
        x: pos.x,
        y: pos.y,
        width: 100,
        height: 100,
        radius: 50,
        text: 'Sample Text',
      };
      setShapes([...shapes, shape]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;

    const stage = stageRef.current;
    const point = getRelativePointerPosition(stage);
    
    if (tool === 'pen') {
      const lastLineIndex = lines.length - 1;
      const lastLine = lines[lastLineIndex];
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      const newLines = lines.slice();
      newLines[lastLineIndex] = lastLine;
      setLines(newLines);
    } else if (tool === 'line' || tool === 'arrow') {
      const lastLineIndex = lines.length - 1;
      const lastLine = lines[lastLineIndex];
      const newPoints = lastLine.points.slice();
      newPoints[2] = point.x;
      newPoints[3] = point.y;
      const newLine = { ...lastLine, points: newPoints };

      setLines((prevLines) => {
        const newLines = prevLines.slice();
        newLines[lastLineIndex] = newLine;
        return newLines;
      });
    } else {
      const lastShapeIndex = shapes.length - 1;
      const shape = shapes[lastShapeIndex];
      shape.width = point.x - shape.x;
      shape.height = point.y - shape.y;
      const newShapes = shapes.slice();
      newShapes[lastShapeIndex] = shape;
      setShapes(newShapes);
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    if (tool === 'pen') {
      const lastLineIndex = lines.length - 1;
      const lastLine = lines[lastLineIndex];
      lastLine.points = interpolatePoints(lastLine.points);
      const newLines = lines.slice();
      newLines[lastLineIndex] = lastLine;
      setLines(newLines);
    }
  };

  const updateShape = (id, newAttrs) => {
    const updatedShapes = shapes.map((shape) => {
      return shape.id === id ? newAttrs : shape;
    });
    setShapes(updatedShapes);
  };

  const handleSelect = (id) => {
    setSelectedId(id);
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const scaleBy = 1.05;
    const oldScale = stage.scaleX();

    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
    };
    stage.position(newPos);
    stage.batchDraw();

    setZoom(Math.round(newScale * 100));
  };

  const handleTextSubmit = () => {
    const newText = {
      id: `text-${shapes.length + 1}`,
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      text: textValue,
      fontSize: 20,
      draggable: true,
    };
    setShapes([...shapes, newText]);
    setTextEditVisible(false);
    setTextValue('');
  };

  const renderCursorIcon = () => {
    switch (tool) {
      case 'square':
        return <FaSquare size={24} className="text-gray-500" />;
      case 'circle':
        return <FaCircle size={24} className="text-gray-500" />;
      case 'text':
        return <FaFont size={24} className="text-gray-500" />;
      case 'pen':
        return <FaPen size={24} className="text-gray-500" />;
      case 'hand':
        return <FaHandPaper size={24} className="text-gray-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={tool === 'eraser' ? 'eraser-cursor' : ''}>
      <ToolSection selectedTool={tool} setSelectedTool={setTool} />
      <div className="relative">
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          draggable={tool === 'pointer' || tool === 'hand'}
          ref={stageRef}
        >
          <Layer>
            {lines.map((line) => (
              line.tool === 'pen' ? (
                <Line
                  key={line.id}
                  id={line.id}
                  points={line.points}
                  stroke="black"
                  strokeWidth={2}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              ) : line.tool === 'line' ? (
                <Line
                  key={line.id}
                  id={line.id}
                  points={line.points}
                  stroke="black"
                  strokeWidth={2}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              ) : (
                <Arrow
                  key={line.id}
                  id={line.id}
                  points={line.points}
                  stroke="black"
                  strokeWidth={2}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  pointerLength={10}
                  pointerWidth={10}
                />
              )
            ))}
            {shapes.map((shape) => (
              <Shape
                key={shape.id}
                id={shape.id}
                shapeProps={shape}
                isSelected={shape.id === selectedId}
                onSelect={() => handleSelect(shape.id)}
                onChange={(newAttrs) => updateShape(shape.id, newAttrs)}
              />
            ))}
          </Layer>
        </Stage>
        <div
          ref={cursorRef}
          className="absolute pointer-events-none"
          style={{ display: tool === 'pointer' ? 'none' : 'block' }}
        >
          {renderCursorIcon()}
        </div>
        {textEditVisible && (
          <textarea
            style={{
              position: 'absolute',
              top: textPosition.y,
              left: textPosition.x,
              fontSize: '20px',
              border: '1px solid black',
              padding: '4px',
              margin: '0',
              overflow: 'hidden',
              background: 'white',
              outline: 'none',
              resize: 'none',
            }}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={handleTextSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTextSubmit();
              }
            }}
            autoFocus
          />
        )}
        <div
          className="absolute bottom-0 left-0 m-4 p-2 bg-white bg-opacity-75 rounded"
          style={{ zIndex: 10 }}
        >
          Zoom: {zoom}%
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
