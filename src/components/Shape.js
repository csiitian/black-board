import React, { useRef, useEffect } from 'react';
import { Rect, Circle, Text, Transformer } from 'react-konva';

const Shape = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      // Attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      {shapeProps.type === 'square' && (
        <Rect
          onClick={onSelect}
          ref={shapeRef}
          {...shapeProps}
          draggable
          fill="transparent"
          stroke="black"
          onDragEnd={(e) => {
            onChange({
              ...shapeProps,
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onTransformEnd={(e) => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            // Reset the scale
            node.scaleX(1);
            node.scaleY(1);

            onChange({
              ...shapeProps,
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
            });
          }}
        />
      )}
      {shapeProps.type === 'circle' && (
        <Circle
          onClick={onSelect}
          ref={shapeRef}
          {...shapeProps}
          draggable
          fill="transparent"
          stroke="black"
          onDragEnd={(e) => {
            onChange({
              ...shapeProps,
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onTransformEnd={(e) => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            const newRadius = Math.max(5, node.radius() * Math.max(scaleX, scaleY));

            // Reset the scale
            node.scaleX(1);
            node.scaleY(1);

            onChange({
              ...shapeProps,
              x: node.x(),
              y: node.y(),
              radius: newRadius,
            });
          }}
        />
      )}
      {shapeProps.type === 'text' && (
        <Text
          onClick={onSelect}
          ref={shapeRef}
          {...shapeProps}
          draggable
          onDragEnd={(e) => {
            onChange({
              ...shapeProps,
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onDblClick={(e) => {
            // Double click to edit text
            const stage = shapeRef.current.getStage();
            const layer = shapeRef.current.getLayer();
            const container = stage.container();
            const textPosition = shapeRef.current.getAbsolutePosition();
            const areaPosition = {
              x: textPosition.x,
              y: textPosition.y,
            };

            const textarea = document.createElement('textarea');
            document.body.appendChild(textarea);

            textarea.value = shapeProps.text;
            textarea.style.position = 'absolute';
            textarea.style.top = `${areaPosition.y}px`;
            textarea.style.left = `${areaPosition.x}px`;
            textarea.style.width = shapeRef.current.width() - shapeRef.current.padding() * 2 + 'px';
            textarea.style.height = shapeRef.current.height() - shapeRef.current.padding() * 2 + 'px';
            textarea.style.fontSize = shapeRef.current.fontSize() + 'px';
            textarea.style.border = 'none';
            textarea.style.padding = '0px';
            textarea.style.margin = '0px';
            textarea.style.overflow = 'hidden';
            textarea.style.background = 'none';
            textarea.style.outline = 'none';
            textarea.style.resize = 'none';
            textarea.style.lineHeight = shapeRef.current.lineHeight();
            textarea.style.fontFamily = shapeRef.current.fontFamily();
            textarea.style.transformOrigin = 'left top';
            textarea.style.textAlign = shapeRef.current.align();
            textarea.style.color = shapeRef.current.fill();

            const rotation = shapeRef.current.rotation();
            let transform = '';
            if (rotation) {
              transform += `rotateZ(${rotation}deg)`;
            }

            let px = 0;
            const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
            if (isFirefox) {
              px += 2 + Math.round(shapeRef.current.fontSize() / 20);
            }
            transform += `translateY(-${px}px)`;

            textarea.style.transform = transform;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight + 3}px`;
            textarea.focus();

            const removeTextarea = () => {
              textarea.parentNode.removeChild(textarea);
              window.removeEventListener('click', handleOutsideClick);
              shapeRef.current.show();
              trRef.current.show();
              trRef.current.forceUpdate();
              layer.draw(); // Redraw the layer
            };

            const setTextareaWidth = (newWidth) => {
              if (!newWidth) {
                newWidth = shapeRef.current.placeholder.length * shapeRef.current.fontSize();
              }
              const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
              const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
              if (isSafari || isFirefox) {
                newWidth = Math.ceil(newWidth);
              }
              const isEdge = document.documentMode || /Edge/.test(navigator.userAgent);
              if (isEdge) {
                newWidth += 1;
              }
              textarea.style.width = `${newWidth}px`;
            };

            textarea.addEventListener('keydown', (e) => {
              if (e.keyCode === 13) {
                shapeRef.current.text(textarea.value);
                onChange({
                  ...shapeProps,
                  text: textarea.value,
                });
                removeTextarea();
              }
              if (e.keyCode === 27) {
                removeTextarea();
              }
            });

            textarea.addEventListener('keydown', (e) => {
              const scale = shapeRef.current.getAbsoluteScale().x;
              setTextareaWidth(shapeRef.current.width() * scale);
              textarea.style.height = 'auto';
              textarea.style.height = `${textarea.scrollHeight + shapeRef.current.fontSize()}px`;
            });

            textarea.addEventListener('blur', () => {
              shapeRef.current.text(textarea.value);
              onChange({
                ...shapeProps,
                text: textarea.value,
              });
              removeTextarea();
            });

            textarea.addEventListener('click', (e) => {
              e.stopPropagation();
            });

            const handleOutsideClick = (e) => {
              if (e.target !== textarea) {
                shapeRef.current.text(textarea.value);
                onChange({
                  ...shapeProps,
                  text: textarea.value,
                });
                removeTextarea();
              }
            };

            window.addEventListener('click', handleOutsideClick);

            shapeRef.current.hide();
            trRef.current.hide();
            layer.draw(); // Redraw the layer
          }}
        />
      )}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default Shape;
